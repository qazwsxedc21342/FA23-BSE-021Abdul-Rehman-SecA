import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PaymentService, Payment, MyCommitteeInstallmentSummary } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="animate-fade-in">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;flex-wrap:wrap;gap:16px;">
        <div>
          <h2 style="font-size:20px;font-weight:700;">Payment History</h2>
          <p style="color:#94a3b8;font-size:14px;max-width:520px;">
            Installment progress per committee, amounts paid, and every payment row (completed, processing, or failed).
          </p>
        </div>
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
          @if (refreshing()) {
            <span style="font-size:12px;color:#6366f1;display:flex;align-items:center;gap:6px;">
              <div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Updating...
            </span>
          }
          <div class="stat-pill">💰 Total paid: <strong style="color:#34d399;">PKR {{ totalPaid().toLocaleString() }}</strong></div>
        </div>
      </div>

      <!-- Global installment summary -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:20px;">
        <div class="glass-card" style="padding:16px;text-align:center;">
          <p style="color:#94a3b8;font-size:11px;margin-bottom:4px;">Installments done</p>
          <p style="font-size:22px;font-weight:800;color:#34d399;">{{ totals().completed }}</p>
          <p style="color:#64748b;font-size:10px;margin-top:4px;">of {{ totals().slots }} total months</p>
        </div>
        <div class="glass-card" style="padding:16px;text-align:center;">
          <p style="color:#94a3b8;font-size:11px;margin-bottom:4px;">Months remaining</p>
          <p style="font-size:22px;font-weight:800;color:#818cf8;">{{ totals().remaining }}</p>
          <p style="color:#64748b;font-size:10px;margin-top:4px;">~ PKR {{ totals().remainingPkr.toLocaleString() }} est.</p>
        </div>
        <div class="glass-card" style="padding:16px;text-align:center;">
          <p style="color:#94a3b8;font-size:11px;margin-bottom:4px;">Processing</p>
          <p style="font-size:22px;font-weight:800;color:#a5b4fc;">{{ totals().processing }}</p>
          <p style="color:#64748b;font-size:10px;margin-top:4px;">awaiting confirmation</p>
        </div>
        <div class="glass-card" style="padding:16px;text-align:center;">
          <p style="color:#94a3b8;font-size:11px;margin-bottom:4px;">Pending / failed</p>
          <p style="font-size:22px;font-weight:800;color:#fbbf24;">{{ totals().pendingFailed }}</p>
          <p style="color:#64748b;font-size:10px;margin-top:4px;">rows in history</p>
        </div>
      </div>

      <!-- Per-committee breakdown -->
      @if (summaries().length > 0) {
        <h3 style="font-size:15px;font-weight:700;margin-bottom:12px;">By committee</h3>
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:28px;">
          @for (s of summaries(); track s.committee_id) {
            <div class="glass-card committee-row">
              <div style="flex:1;min-width:200px;">
                <a [routerLink]="['/committees', s.committee_id]" style="font-weight:700;font-size:14px;color:#e2e8f0;text-decoration:none;">
                  {{ s.committee_name }}
                </a>
                <p style="color:#64748b;font-size:11px;margin-top:4px;">
                  PKR {{ s.monthly_amount.toLocaleString() }}/mo · {{ s.duration_months }} months · committee month {{ s.committee_current_month }}
                </p>
              </div>
              <div class="row-stats">
                <div class="mini-stat"><span class="lbl">Paid</span><span class="val ok">{{ s.completed_installments }}/{{ s.duration_months }}</span></div>
                <div class="mini-stat"><span class="lbl">PKR paid</span><span class="val ok">PKR {{ s.amount_paid_completed.toLocaleString() }}</span></div>
                <div class="mini-stat"><span class="lbl">Left</span><span class="val">{{ s.remaining_installments }} mo · ~PKR {{ s.amount_remaining_estimate.toLocaleString() }}</span></div>
                @if (s.next_unpaid_month) {
                  <div class="mini-stat"><span class="lbl">Next due</span><span class="val">M{{ s.next_unpaid_month }}</span></div>
                } @else {
                  <div class="mini-stat"><span class="lbl">Next due</span><span class="val">—</span></div>
                }
                @if (s.processing_installments > 0) {
                  <div class="mini-stat"><span class="lbl">Processing</span><span class="val warn">{{ s.processing_installments }}</span></div>
                }
              </div>
              <a [routerLink]="['/payments', s.committee_id]" class="btn-secondary" style="padding:8px 12px;font-size:12px;white-space:nowrap;">Pay</a>
            </div>
          }
        </div>
      }

      <h3 style="font-size:15px;font-weight:700;margin-bottom:12px;">All payment records</h3>

      @if (loading()) {
        <div class="page-loader"><div class="spinner"></div></div>
      } @else if (payments().length === 0 && summaries().length === 0) {
        <div class="glass-card" style="padding:60px;text-align:center;">
          <div style="font-size:56px;margin-bottom:16px;">💳</div>
          <h3 style="font-size:18px;font-weight:700;margin-bottom:8px;">No payments yet</h3>
          <p style="color:#94a3b8;font-size:14px;margin-bottom:20px;">Join a committee and make your first installment.</p>
          <a routerLink="/committees" class="btn-primary">Browse Committees</a>
        </div>
      } @else if (payments().length === 0) {
        <p style="color:#94a3b8;font-size:13px;margin-bottom:16px;">No individual payment rows yet — progress above is from your committee memberships.</p>
      } @else {
        <div class="glass-card" style="overflow:hidden;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Committee</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Reference / ID</th>
                <th>Paid date</th>
              </tr>
            </thead>
            <tbody>
              @for (p of payments(); track p.id) {
                <tr>
                  <td style="font-weight:600;font-size:13px;">{{ p.committees?.name || '—' }}</td>
                  <td style="color:#94a3b8;">M{{ p.month_number }}</td>
                  <td style="color:#34d399;font-weight:700;">PKR {{ num(p.amount).toLocaleString() }}</td>
                  <td><span class="badge badge-{{p.status}}">{{ p.status }}</span></td>
                  <td style="font-family:monospace;font-size:11px;color:#64748b;">{{ formatTxId(p.stripe_payment_intent_id) }}</td>
                  <td style="color:#94a3b8;font-size:12px;">{{ p.paid_at ? formatDate(p.paid_at) : '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .stat-pill { background:rgba(15,23,42,0.6);border:1px solid rgba(99,102,241,0.2);padding:8px 16px;border-radius:20px;font-size:13px;color:#94a3b8; }
    .committee-row { display:flex;align-items:center;gap:16px;padding:16px 18px;flex-wrap:wrap; }
    .row-stats { display:flex;flex-wrap:wrap;gap:12px 20px;flex:2;justify-content:flex-end; }
    .mini-stat { display:flex;flex-direction:column;gap:2px;min-width:72px; }
    .mini-stat .lbl { font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.04em; }
    .mini-stat .val { font-size:12px;font-weight:600;color:#e2e8f0; }
    .mini-stat .val.ok { color:#34d399; }
    .mini-stat .val.warn { color:#a5b4fc; }
  `]
})
export class PaymentHistoryComponent implements OnInit, OnDestroy {
  private paymentService = inject(PaymentService);
  private auth = inject(AuthService);
  private supabase = inject(SupabaseService);

  loading = signal(true);
  refreshing = signal(false);
  payments = signal<Payment[]>([]);
  summaries = signal<MyCommitteeInstallmentSummary[]>([]);
  private realtimeChannel: any;

  num(v: unknown) {
    return Number(v) || 0;
  }

  totalPaid = () =>
    this.payments()
      .filter(p => p.status === 'completed')
      .reduce((s, p) => s + this.num(p.amount), 0);

  totals = () => {
    const sums = this.summaries();
    return {
      completed: sums.reduce((a, s) => a + s.completed_installments, 0),
      remaining: sums.reduce((a, s) => a + s.remaining_installments, 0),
      slots: sums.reduce((a, s) => a + s.duration_months, 0),
      remainingPkr: sums.reduce((a, s) => a + s.amount_remaining_estimate, 0),
      processing: sums.reduce((a, s) => a + s.processing_installments, 0),
      pendingFailed: this.payments().filter(p => p.status === 'pending' || p.status === 'failed').length
    };
  };

  formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatTxId(id?: string | null) {
    if (!id) return '—';
    return id.length > 26 ? id.slice(0, 24) + '…' : id;
  }

  async ngOnInit() {
    await this.loadAll();
    this.subscribeToPayments();
  }

  ngOnDestroy() {
    if (this.realtimeChannel) {
      this.supabase.client.removeChannel(this.realtimeChannel);
    }
  }

  async loadAll() {
    const [data, sums] = await Promise.all([
      this.paymentService.getMyPayments(),
      this.paymentService.getMyInstallmentSummaries()
    ]);
    this.payments.set(data);
    this.summaries.set(sums);
    this.loading.set(false);
  }

  subscribeToPayments() {
    const userId = this.auth.currentUser?.id;
    if (!userId) return;

    this.realtimeChannel = this.supabase.client
      .channel(`payment-history-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' }, async () => {
        this.refreshing.set(true);
        await this.loadAll();
        this.refreshing.set(false);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'payments' }, async () => {
        this.refreshing.set(true);
        await this.loadAll();
        this.refreshing.set(false);
      })
      .subscribe();
  }
}
