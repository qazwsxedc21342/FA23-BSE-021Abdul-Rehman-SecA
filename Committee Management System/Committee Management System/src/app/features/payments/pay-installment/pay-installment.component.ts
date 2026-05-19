import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../core/services/payment.service';
import { CommitteeService } from '../../../core/services/committee.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { NotificationService } from '../../../core/services/notification.service';
import { loadStripe } from '@stripe/stripe-js';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-pay-installment',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="animate-fade-in" style="max-width:600px;margin:0 auto;">
      <a [routerLink]="['/committees', committeeId()]" style="color:#94a3b8;font-size:13px;text-decoration:none;">← Back to Committee</a>
      <h2 style="font-size:20px;font-weight:700;margin:12px 0 4px;">Pay Installment</h2>

      @if (loading()) {
        <div class="page-loader"><div class="spinner"></div></div>
      } @else if (committee()) {
        <!-- Summary Card -->
        <div class="glass-card" style="padding:24px;margin:20px 0;background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(16,185,129,0.08));">
          <h3 style="font-size:15px;font-weight:700;margin-bottom:16px;">💳 Payment Summary</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div><p style="color:#94a3b8;font-size:12px;">Committee</p><p style="font-weight:700;font-size:15px;">{{ committee()!.name }}</p></div>
            <div><p style="color:#94a3b8;font-size:12px;">Monthly Amount</p><p style="font-weight:700;font-size:20px;color:#34d399;">PKR {{ committee()!.monthly_amount.toLocaleString() }}</p></div>
            <div><p style="color:#94a3b8;font-size:12px;">Your Position</p><p style="font-weight:700;">Member #{{ myPosition() }}</p></div>
            <div><p style="color:#94a3b8;font-size:12px;">Payment Month</p><p style="font-weight:700;">Month {{ currentMonth() }}</p></div>
          </div>
        </div>

        @if (alreadyPaid()) {
          <div class="glass-card" style="padding:32px;text-align:center;">
            <div style="font-size:56px;margin-bottom:16px;">✅</div>
            <h3 style="font-size:18px;font-weight:700;margin-bottom:8px;">Already Paid!</h3>
            <p style="color:#94a3b8;font-size:14px;margin-bottom:20px;">You have already paid for this month.</p>
            <a routerLink="/payment-history" class="btn-primary">View Payment History</a>
          </div>
        } @else {
          <!-- Payment Card -->
          <div class="glass-card" style="padding:28px;">
            <h3 style="font-size:15px;font-weight:700;margin-bottom:14px;">Payment method</h3>
            <div class="pay-mode-tabs">
              <button type="button" class="pay-mode-tab" [class.active]="payMode() === 'card'" (click)="setPayMode('card')">Card (Stripe)</button>
              <button type="button" class="pay-mode-tab" [class.active]="payMode() === 'bank'" (click)="setPayMode('bank')">Bank / IBAN</button>
              <button type="button" class="pay-mode-tab" [class.active]="payMode() === 'jazzcash'" (click)="setPayMode('jazzcash')">JazzCash</button>
            </div>

            <div [style.display]="payMode() === 'card' ? 'block' : 'none'">
              <h3 style="font-size:15px;font-weight:700;margin:20px 0 16px;">💳 Card Details (Stripe Test Mode)</h3>
              <div style="background:rgba(15,23,42,0.8);border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:16px;margin-bottom:20px;">
                <div id="stripe-card-element" style="min-height:24px;"></div>
              </div>
              <div class="test-card-hint">
                <span>🔒 Test card:</span>
                <code>4242 4242 4242 4242</code>
                <span>Exp: 12/34 CVV: 123</span>
              </div>
            </div>
            @if (payMode() === 'bank' || payMode() === 'jazzcash') {
              <div class="manual-payout-box">
                <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">Send <strong style="color:#34d399;">PKR {{ committee()!.monthly_amount.toLocaleString() }}</strong> to the committee account / wallet:</p>
                <code class="payout-value">{{ committee()!.iban?.trim() || '— Add IBAN or wallet in committee settings' }}</code>
                @if (committee()!.payment_method && committee()!.payment_method !== 'stripe') {
                  <p style="margin:10px 0 0;font-size:11px;color:#64748b;">Preferred: {{ committee()!.payment_method }}</p>
                }
              </div>
              @if (payMode() === 'bank') {
                <label class="manual-label" for="manual-iban">Your IBAN or bank transfer reference</label>
                <input id="manual-iban" class="manual-input" type="text" autocomplete="off" placeholder="e.g. PK36SCBL0000001123456702 or transaction / reference ID" [value]="manualRef()" (input)="onManualRefInput($event)" />
                <p class="manual-hint">After you transfer, enter the IBAN you paid from or the bank reference ID so the organizer can match your payment.</p>
              } @else {
                <label class="manual-label" for="manual-jazz">Your JazzCash number or transaction ID</label>
                <input id="manual-jazz" class="manual-input" type="text" inputmode="numeric" autocomplete="off" placeholder="e.g. 03001234567 or JazzCash receipt ID" [value]="manualRef()" (input)="onManualRefInput($event)" />
                <p class="manual-hint">Enter the wallet number you sent from or the transaction ID from your JazzCash receipt.</p>
              }
            }

            @if (payError()) { <div class="error-banner" style="margin-bottom:16px;margin-top:16px;">❌ {{ payError() }}</div> }
            @if (paySuccess()) {
              <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:#34d399;padding:14px 18px;border-radius:10px;margin-bottom:16px;">
                ✅ Payment successful! Your installment has been recorded.
              </div>
            }
            <button class="btn-primary" style="width:100%;justify-content:center;font-size:15px;padding:14px;margin-top:16px;" (click)="submitPayment()" [disabled]="processing() || paySuccess()" id="pay-submit-btn">
              @if (processing()) { <div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Processing... }
              @else if (paySuccess()) { ✅ Paid Successfully }
              @else if (payMode() === 'card') { 🔒 Pay PKR {{ committee()!.monthly_amount.toLocaleString() }} }
              @else { ✓ Confirm payment (PKR {{ committee()!.monthly_amount.toLocaleString() }}) }
            </button>
            @if (payMode() === 'card') {
              <p style="color:#64748b;font-size:12px;text-align:center;margin-top:12px;">🔐 Secured by Stripe · All transactions are encrypted</p>
            } @else {
              <p style="color:#64748b;font-size:12px;text-align:center;margin-top:12px;">Manual payments are logged for the organizer to verify against their bank or JazzCash statement.</p>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .pay-mode-tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:4px; }
    .pay-mode-tab { flex:1; min-width:90px; padding:10px 12px; border-radius:10px; border:1px solid rgba(99,102,241,0.35); background:rgba(15,23,42,0.6); color:#94a3b8; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; }
    .pay-mode-tab:hover { border-color:rgba(99,102,241,0.6); color:#e2e8f0; }
    .pay-mode-tab.active { background:rgba(99,102,241,0.25); border-color:#6366f1; color:#c7d2fe; }
    .manual-payout-box { background:rgba(15,23,42,0.75); border:1px solid rgba(99,102,241,0.25); border-radius:10px; padding:14px 16px; margin-top:8px; margin-bottom:16px; }
    .payout-value { display:block; margin-top:4px; padding:10px 12px; background:rgba(0,0,0,0.35); border-radius:8px; font-family:monospace; font-size:13px; color:#f1f5f9; word-break:break-all; }
    .manual-label { display:block; font-size:12px; font-weight:600; color:#cbd5e1; margin-bottom:8px; }
    .manual-input { width:100%; box-sizing:border-box; padding:12px 14px; border-radius:10px; border:1px solid rgba(99,102,241,0.35); background:rgba(15,23,42,0.9); color:#f1f5f9; font-size:14px; margin-bottom:8px; }
    .manual-input:focus { outline:none; border-color:#6366f1; box-shadow:0 0 0 2px rgba(99,102,241,0.2); }
    .manual-hint { font-size:11px; color:#64748b; margin:0 0 4px; line-height:1.4; }
    .test-card-hint { background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:10px;font-size:12px;color:#fbbf24;margin-bottom:16px;flex-wrap:wrap; }
    code { background:rgba(0,0,0,0.3);padding:2px 8px;border-radius:4px;font-family:monospace;color:#f1f5f9; }
    .error-banner { background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#f87171;padding:12px 16px;border-radius:10px;font-size:13px; }
  `]
})
export class PayInstallmentComponent implements OnInit {
  route = inject(ActivatedRoute);
  paymentService = inject(PaymentService);
  committeeService = inject(CommitteeService);
  auth = inject(AuthService);
  toast = inject(ToastService);
  notificationService = inject(NotificationService);

  committeeId = signal('');
  committee = signal<any>(null);
  loading = signal(true);
  processing = signal(false);
  payError = signal('');
  paySuccess = signal(false);
  alreadyPaid = signal(false);
  myPosition = signal(0);
  currentMonth = signal(1);
  myMemberId = signal('');
  myName = signal('A member');
  private stripe: any;
  private cardElement: any;
  private stripeMounted = false;

  payMode = signal<'card' | 'bank' | 'jazzcash'>('card');
  manualRef = signal('');

  setPayMode(mode: 'card' | 'bank' | 'jazzcash') {
    this.payMode.set(mode);
    this.payError.set('');
    if (mode !== 'card') this.manualRef.set('');
    if (mode === 'card') setTimeout(() => this.initStripe(), 0);
  }

  onManualRefInput(ev: Event) {
    const v = (ev.target as HTMLInputElement).value;
    this.manualRef.set(v);
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('committeeId')!;
    this.committeeId.set(id);
    const c = await this.committeeService.getCommitteeById(id);
    this.committee.set(c);
    const members = await this.committeeService.getMembers(id);
    const me = members.find((m: any) => m.user_id === this.auth.currentUser?.id);
    if (me) { 
      this.myPosition.set(me.position); 
      this.myMemberId.set(me.id); 
      if (me.profiles?.full_name) this.myName.set(me.profiles.full_name);
    }
    const start = new Date(c?.start_date || Date.now());
    const now = new Date();
    const diff = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth() + 1;
    this.currentMonth.set(Math.max(1, Math.min(diff, c?.duration_months || 1)));
    const dues = await this.paymentService.getDuePayments(id, this.myMemberId());
    this.alreadyPaid.set(dues.length === 0 && this.currentMonth() > 1);
    this.loading.set(false);
    setTimeout(() => this.initStripe(), 100);
  }

  async initStripe() {
    if (this.stripeMounted) return;
    try {
      this.stripe = await loadStripe(environment.stripePublishableKey);
      if (!this.stripe) return;
      const el = document.getElementById('stripe-card-element');
      if (!el) return;
      const elements = this.stripe.elements({ appearance: { theme: 'night', variables: { colorPrimary: '#6366f1', colorBackground: '#0f172a', colorText: '#f1f5f9' } } });
      this.cardElement = elements.create('card', { style: { base: { color: '#f1f5f9', fontFamily: 'Inter, sans-serif', fontSize: '15px', '::placeholder': { color: '#64748b' } } } });
      this.cardElement.mount('#stripe-card-element');
      this.stripeMounted = true;
    } catch (e) { console.warn('Stripe not available in this environment'); }
  }

  async submitPayment() {
    this.processing.set(true); this.payError.set('');
    const amount = this.committee()?.monthly_amount;
    const committeeId = this.committeeId();
    const memberId = this.myMemberId();
    const monthNum = this.currentMonth();

    if (this.payMode() === 'bank' || this.payMode() === 'jazzcash') {
      const ref = this.manualRef().trim();
      if (ref.length < 8) {
        this.payError.set('Enter your IBAN / bank reference or JazzCash details (at least 8 characters).');
        this.processing.set(false);
        return;
      }
      const channel = this.payMode() === 'bank' ? 'bank_transfer' : 'jazzcash';
      const { error } = await this.paymentService.completeManualPayment(committeeId, memberId, amount, monthNum, ref, channel);
      if (error) {
        this.payError.set(error);
        this.processing.set(false);
        return;
      }
      await this.sendNotifications();
      this.paySuccess.set(true);
      this.toast.success('Payment recorded — organizer can verify your transfer.');
      this.processing.set(false);
      return;
    }

    const { clientSecret, paymentId, error } = await this.paymentService.initiatePayment(
      committeeId, memberId, amount, monthNum
    );
    if (error) { this.payError.set(error); this.processing.set(false); return; }
    if (!clientSecret) {
      this.paySuccess.set(true);
      this.toast.success('Payment recorded successfully! 🎉');
      this.processing.set(false); 
      await this.sendNotifications();
      return;
    }
    const { error: stripeError, paymentIntentId } = await this.paymentService.confirmStripePayment(
      clientSecret,
      this.cardElement
    );
    if (stripeError) {
      this.payError.set(stripeError);
      this.processing.set(false);
      return;
    }
    if (paymentId && paymentIntentId) {
      const { error: saveErr } = await this.paymentService.finalizeStripeCardPayment(paymentId, paymentIntentId);
      if (saveErr) {
        this.payError.set(saveErr);
        this.processing.set(false);
        return;
      }
    }

    await this.sendNotifications();

    this.paySuccess.set(true);
    this.toast.success('Payment successful! 🎉');
    this.processing.set(false);
  }

  async sendNotifications() {
    const creatorId = this.committee()?.creator_id;
    const committeeName = this.committee()?.name;
    const userId = this.auth.currentUser?.id;
    
    if (creatorId && userId && creatorId !== userId) {
      await this.notificationService.createNotification(
        creatorId,
        'Payment Received',
        `${this.myName()} has paid their installment for ${committeeName}.`,
        'payment'
      );
    }
    if (userId) {
      await this.notificationService.createNotification(
        userId,
        'Payment Successful',
        `Your installment for ${committeeName} was successful.`,
        'payment'
      );
    }
  }
}
