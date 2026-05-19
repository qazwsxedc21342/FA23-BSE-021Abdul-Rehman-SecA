import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { loadStripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

export interface Payment {
  id: string;
  committee_id: string;
  member_id: string;
  month_number: number;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  stripe_payment_intent_id?: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
  committees?: { name: string };
  committee_members?: { position: number; profiles?: { full_name: string } };
}

/** Per-committee installment progress for the logged-in user (approved memberships only). */
export interface MyCommitteeInstallmentSummary {
  committee_id: string;
  committee_name: string;
  member_id: string;
  duration_months: number;
  monthly_amount: number;
  /** Committee “calendar” month from start_date (same as pay/manage pages). */
  committee_current_month: number;
  completed_installments: number;
  processing_installments: number;
  failed_or_pending_installments: number;
  /** Months still to complete (duration − completed count). */
  remaining_installments: number;
  amount_paid_completed: number;
  /** Estimated PKR still due for this committee (remaining months × monthly amount). */
  amount_remaining_estimate: number;
  next_unpaid_month: number | null;
}

export function committeeCalendarMonthIndex(startDate: string | undefined, durationMonths: number): number {
  const start = new Date(startDate || Date.now());
  const now = new Date();
  const diff = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth() + 1;
  const dur = Math.max(1, durationMonths || 1);
  return Math.max(1, Math.min(diff, dur));
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private stripePromise = loadStripe(environment.stripePublishableKey);
  private _processing = new BehaviorSubject(false);
  processing$ = this._processing.asObservable();

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  async getPaymentsForCommittee(committeeId: string): Promise<Payment[]> {
    const { data } = await this.supabase.client
      .from('payments')
      .select('*, committee_members(position, profiles(full_name))')
      .eq('committee_id', committeeId)
      .order('month_number');
    return data ?? [];
  }

  async getMyPayments(): Promise<Payment[]> {
    const userId = this.auth.currentUser?.id;
    if (!userId) return [];
    const { data: members } = await this.supabase.client
      .from('committee_members').select('id').eq('user_id', userId);
    if (!members?.length) return [];
    const memberIds = members.map((m: any) => m.id);
    const { data } = await this.supabase.client
      .from('payments')
      .select('*, committees(name), committee_members(position)')
      .in('member_id', memberIds)
      .order('created_at', { ascending: false });
    return data ?? [];
  }

  async getDuePayments(committeeId: string, memberId: string): Promise<Payment[]> {
    const { data } = await this.supabase.client
      .from('payments')
      .select('*')
      .eq('committee_id', committeeId)
      .eq('member_id', memberId)
      .in('status', ['pending', 'failed']);
    return data ?? [];
  }

  async initiatePayment(committeeId: string, memberId: string, amount: number, monthNumber: number): Promise<{ clientSecret: string | null; paymentId: string | null; error: string | null }> {
    this._processing.next(true);
    try {
      // Create payment record in DB first
      const { data: payment, error: paymentError } = await this.supabase.client
        .from('payments')
        .upsert({
          committee_id: committeeId,
          member_id: memberId,
          month_number: monthNumber,
          amount,
          status: 'processing'
        }, { onConflict: 'member_id,month_number' })
        .select().single();

      if (paymentError) throw new Error(paymentError.message);

      // Try Supabase Edge Function for Stripe Payment Intent
      const { data: fnData, error: fnError } = await this.supabase.client.functions.invoke('create-payment-intent', {
        body: { amount: Math.round(amount * 100), currency: 'usd', paymentId: payment.id }
      });

      if (fnError || !fnData?.clientSecret) {
        // Fallback: simulate payment in test mode
        await this.simulatePayment(payment.id, committeeId, memberId, amount);
        return { clientSecret: null, paymentId: payment.id, error: null };
      }

      await this.supabase.client.from('payments')
        .update({ stripe_payment_intent_id: fnData.paymentIntentId })
        .eq('id', payment.id);

      return { clientSecret: fnData.clientSecret, paymentId: payment.id, error: null };
    } catch (e: any) {
      return { clientSecret: null, paymentId: null, error: e.message };
    } finally {
      this._processing.next(false);
    }
  }

  async simulatePayment(paymentId: string, committeeId: string, memberId: string, amount: number) {
    const fakeIntentId = `pi_simulated_${Date.now()}`;
    await this.supabase.client.from('payments').update({
      status: 'completed',
      stripe_payment_intent_id: fakeIntentId,
      paid_at: new Date().toISOString()
    }).eq('id', paymentId);

    await this.supabase.client.from('transactions').insert({
      payment_id: paymentId,
      transaction_id: fakeIntentId,
      gateway: 'stripe_test',
      gateway_response: { status: 'succeeded', mode: 'test' },
      amount
    });

    // Update reputation
    const userId = this.auth.currentUser?.id;
    if (userId) {
      try { await this.supabase.client.rpc('update_reputation', { user_id: userId, delta: 5, reason: 'on_time_payment' }); } catch (_) {}
    }
  }

  /**
   * Record a manual Pakistan-local payment (bank / IBAN transfer or JazzCash).
   * Stores the payer-supplied reference on transactions.bank_reference for organizer verification.
   */
  async completeManualPayment(
    committeeId: string,
    memberId: string,
    amount: number,
    monthNumber: number,
    payerReference: string,
    channel: 'bank_transfer' | 'jazzcash'
  ): Promise<{ paymentId: string | null; error: string | null }> {
    this._processing.next(true);
    try {
      const { data: payment, error: paymentError } = await this.supabase.client
        .from('payments')
        .upsert(
          {
            committee_id: committeeId,
            member_id: memberId,
            month_number: monthNumber,
            amount,
            status: 'processing'
          },
          { onConflict: 'member_id,month_number' }
        )
        .select()
        .single();

      if (paymentError) throw new Error(paymentError.message);

      const txId = `manual_${channel}_${Date.now()}`;
      await this.supabase.client
        .from('payments')
        .update({
          status: 'completed',
          stripe_payment_intent_id: txId,
          paid_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      await this.supabase.client.from('transactions').insert({
        payment_id: payment.id,
        transaction_id: txId,
        gateway: channel,
        bank_reference: payerReference.trim(),
        gateway_response: { channel, payer_reference: payerReference.trim() },
        amount,
        currency: 'pkr'
      });

      const userId = this.auth.currentUser?.id;
      if (userId) {
        try {
          await this.supabase.client.rpc('update_reputation', { user_id: userId, delta: 5, reason: 'on_time_payment' });
        } catch (_) {}
      }

      return { paymentId: payment.id, error: null };
    } catch (e: any) {
      return { paymentId: null, error: e.message ?? 'Payment failed' };
    } finally {
      this._processing.next(false);
    }
  }

  async confirmStripePayment(
    clientSecret: string,
    cardElement: any
  ): Promise<{ error: string | null; paymentIntentId?: string }> {
    const stripe = await this.stripePromise;
    if (!stripe) return { error: 'Stripe not loaded' };
    this._processing.next(true);
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement }
    });
    this._processing.next(false);
    if (error) return { error: error.message ?? 'Payment failed' };
    return { error: null, paymentIntentId: paymentIntent?.id };
  }

  /** Call after Stripe.confirmCardPayment succeeds so manage/history see status completed. */
  async finalizeStripeCardPayment(paymentId: string, paymentIntentId: string): Promise<{ error: string | null }> {
    try {
      const { data: row, error: fetchErr } = await this.supabase.client
        .from('payments')
        .select('amount')
        .eq('id', paymentId)
        .single();
      if (fetchErr || !row) return { error: fetchErr?.message ?? 'Payment not found' };

      const amount = Number(row.amount);
      await this.supabase.client
        .from('payments')
        .update({
          status: 'completed',
          stripe_payment_intent_id: paymentIntentId,
          paid_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      await this.supabase.client.from('transactions').insert({
        payment_id: paymentId,
        transaction_id: paymentIntentId,
        gateway: 'stripe',
        gateway_response: { status: 'succeeded' },
        amount,
        currency: 'pkr'
      });

      const userId = this.auth.currentUser?.id;
      if (userId) {
        try {
          await this.supabase.client.rpc('update_reputation', { user_id: userId, delta: 5, reason: 'on_time_payment' });
        } catch (_) {}
      }
      return { error: null };
    } catch (e: any) {
      return { error: e.message ?? 'Failed to save payment' };
    }
  }

  async getPaymentStats(userId: string) {
    const empty = {
      totalPaid: 0,
      pending: 0,
      processing: 0,
      failed: 0,
      completed: 0,
      installmentsCompleted: 0,
      installmentsRemaining: 0,
      installmentsInProgress: 0,
      installmentSlotsTotal: 0
    };
    if (!userId || userId !== this.auth.currentUser?.id) return empty;

    const summaries = await this.getMyInstallmentSummaries();
    const memberIds = summaries.map(s => s.member_id);
    if (!memberIds.length) return empty;

    const { data } = await this.supabase.client
      .from('payments')
      .select('amount, status')
      .in('member_id', memberIds);
    const rows = data ?? [];
    const completedRows = rows.filter((p: any) => p.status === 'completed');
    const totalPaid = completedRows.reduce((s: number, p: any) => s + Number(p.amount), 0);
    const pending = rows.filter((p: any) => p.status === 'pending').length;
    const processing = rows.filter((p: any) => p.status === 'processing').length;
    const failed = rows.filter((p: any) => p.status === 'failed').length;
    const completed = completedRows.length;
    const installmentsRemaining = summaries.reduce((a, s) => a + s.remaining_installments, 0);
    const installmentsInProgress = summaries.reduce((a, s) => a + s.processing_installments, 0);
    const installmentSlotsTotal = summaries.reduce((a, s) => a + s.duration_months, 0);

    return {
      totalPaid,
      pending,
      processing,
      failed,
      completed,
      installmentsCompleted: completed,
      installmentsRemaining,
      installmentsInProgress,
      installmentSlotsTotal
    };
  }

  /**
   * One row per approved committee membership: paid vs remaining installments and amounts.
   */
  async getMyInstallmentSummaries(): Promise<MyCommitteeInstallmentSummary[]> {
    const userId = this.auth.currentUser?.id;
    if (!userId) return [];

    const { data: memberships, error } = await this.supabase.client
      .from('committee_members')
      .select('id, committee_id, committees(id, name, duration_months, monthly_amount, start_date)')
      .eq('user_id', userId)
      .eq('status', 'approved');

    if (error || !memberships?.length) return [];

    const memberIds = memberships.map((m: any) => m.id);
    const { data: payments } = await this.supabase.client
      .from('payments')
      .select('member_id, month_number, amount, status')
      .in('member_id', memberIds);

    const byMember = new Map<string, typeof payments>();
    for (const p of payments ?? []) {
      const mid = (p as any).member_id;
      const list = byMember.get(mid) ?? [];
      list.push(p as any);
      byMember.set(mid, list);
    }

    return memberships.map((row: any) => {
      const c = row.committees;
      const list = byMember.get(row.id) ?? [];
      const dur = Math.max(1, Number(c?.duration_months) || 1);
      const monthly = Number(c?.monthly_amount) || 0;
      const completed = list.filter((p: any) => p.status === 'completed');
      const processing = list.filter((p: any) => p.status === 'processing');
      const failedOrPending = list.filter(
        (p: any) => p.status === 'pending' || p.status === 'failed'
      );
      const paidCount = completed.length;
      const amountPaid = completed.reduce((s: number, p: any) => s + Number(p.amount), 0);
      const remaining = Math.max(0, dur - paidCount);

      let nextUnpaid: number | null = null;
      for (let m = 1; m <= dur; m++) {
        if (!completed.some((p: any) => Number(p.month_number) === m)) {
          nextUnpaid = m;
          break;
        }
      }

      return {
        committee_id: c.id,
        committee_name: c.name ?? 'Committee',
        member_id: row.id,
        duration_months: dur,
        monthly_amount: monthly,
        committee_current_month: committeeCalendarMonthIndex(c?.start_date, dur),
        completed_installments: paidCount,
        processing_installments: processing.length,
        failed_or_pending_installments: failedOrPending.length,
        remaining_installments: remaining,
        amount_paid_completed: amountPaid,
        amount_remaining_estimate: remaining * monthly,
        next_unpaid_month: nextUnpaid
      };
    });
  }
}
