import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CommitteeService, Committee, CommitteeMember } from '../../../core/services/committee.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaymentService, Payment, MyCommitteeInstallmentSummary } from '../../../core/services/payment.service';

@Component({
  selector: 'app-committee-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="animate-fade-in">
      @if (loading()) {
        <div class="page-loader"><div class="spinner"></div><p style="color:#94a3b8;">Loading...</p></div>
      } @else if (committee()) {
        <!-- Header -->
        <div class="glass-card" style="padding:28px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
            <div>
              <a routerLink="/committees" style="color:#94a3b8;font-size:13px;text-decoration:none;">← Committees</a>
              <h1 style="font-size:22px;font-weight:800;margin-top:8px;">{{ committee()!.name }}</h1>
              <p style="color:#94a3b8;font-size:14px;margin-top:4px;">{{ committee()!.description }}</p>
              <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
                <span class="badge badge-{{committee()!.status}}">{{ committee()!.status }}</span>
              </div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              @if (isAdmin()) {
                <a [routerLink]="['/committees', committee()!.id, 'manage']" class="btn-secondary" id="go-manage">⚙️ Manage</a>
              }
              @if (isMember() && myMembership()?.status === 'approved') {
                <a [routerLink]="['/payments', committee()!.id]" class="btn-primary" id="go-pay">💳 Pay Installment</a>
              }
              @if (!isMember() && committee()!.status === 'open') {
                <button class="btn-primary" (click)="requestJoin()" [disabled]="joining()" id="btn-join">
                  @if (joining()) { Requesting... } @else { Join Committee }
                </button>
              }
              @if (myMembership()?.status === 'pending') {
                <span class="badge badge-pending" style="padding:10px 16px;">⏳ Pending Approval</span>
              }
            </div>
          </div>
        </div>

        @if (myInstallment(); as mi) {
          <div class="glass-card" style="padding:22px;margin-bottom:20px;border:1px solid rgba(16,185,129,0.25);background:rgba(16,185,129,0.06);">
            <h3 style="font-size:15px;font-weight:700;margin-bottom:14px;">📌 Your installment record</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px;margin-bottom:14px;">
              <div>
                <p style="color:#94a3b8;font-size:11px;margin-bottom:4px;">Paid</p>
                <p style="font-size:18px;font-weight:800;color:#34d399;">{{ mi.completed_installments }} / {{ mi.duration_months }}</p>
                <p style="color:#64748b;font-size:10px;">installments</p>
              </div>
              <div>
                <p style="color:#94a3b8;font-size:11px;margin-bottom:4px;">PKR paid (completed)</p>
                <p style="font-size:16px;font-weight:700;color:#f1f5f9;">PKR {{ mi.amount_paid_completed.toLocaleString() }}</p>
              </div>
              <div>
                <p style="color:#94a3b8;font-size:11px;margin-bottom:4px;">Remaining</p>
                <p style="font-size:16px;font-weight:700;color:#818cf8;">{{ mi.remaining_installments }} mo (~PKR {{ mi.amount_remaining_estimate.toLocaleString() }})</p>
              </div>
              <div>
                <p style="color:#94a3b8;font-size:11px;margin-bottom:4px;">Committee month / next due</p>
                <p style="font-size:14px;font-weight:600;color:#e2e8f0;">
                  Now M{{ mi.committee_current_month }}
                  @if (mi.next_unpaid_month) { · Pay M{{ mi.next_unpaid_month }} next }
                  @else { · All installments paid }
                </p>
              </div>
              @if (mi.processing_installments > 0) {
                <div>
                  <p style="color:#94a3b8;font-size:11px;margin-bottom:4px;">Processing</p>
                  <p style="font-size:14px;font-weight:700;color:#a5b4fc;">{{ mi.processing_installments }} payment(s)</p>
                </div>
              }
            </div>
            <a [routerLink]="['/payments', committee()!.id]" class="btn-primary" style="font-size:13px;padding:10px 18px;">Pay installment</a>
          </div>
        }

        <!-- Stats -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">
          <div class="glass-card" style="padding:20px;text-align:center;">
            <p style="color:#94a3b8;font-size:12px;margin-bottom:4px;">Monthly</p>
            <p style="font-size:18px;font-weight:800;color:#818cf8;">PKR {{ committee()!.monthly_amount.toLocaleString() }}</p>
          </div>
          <div class="glass-card" style="padding:20px;text-align:center;">
            <p style="color:#94a3b8;font-size:12px;margin-bottom:4px;">Members</p>
            <p style="font-size:18px;font-weight:800;color:#34d399;">{{ committee()!.current_members }}/{{ committee()!.max_members }}</p>
          </div>
          <div class="glass-card" style="padding:20px;text-align:center;">
            <p style="color:#94a3b8;font-size:12px;margin-bottom:4px;">Duration</p>
            <p style="font-size:18px;font-weight:800;color:#fbbf24;">{{ committee()!.duration_months }} mo</p>
          </div>
          <div class="glass-card" style="padding:20px;text-align:center;">
            <p style="color:#94a3b8;font-size:12px;margin-bottom:4px;">Pool/Month</p>
            <p style="font-size:18px;font-weight:800;color:#f87171;">PKR {{ (committee()!.monthly_amount * committee()!.max_members).toLocaleString() }}</p>
          </div>
        </div>

        <!-- Progress -->
        <div class="glass-card" style="padding:20px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:13px;font-weight:600;">Member Capacity</span>
            <span style="font-size:13px;color:#94a3b8;">{{ committee()!.current_members }}/{{ committee()!.max_members }}</span>
          </div>
          <div class="progress-bar" style="height:10px;">
            <div class="progress-fill" [style.width.%]="(committee()!.current_members / committee()!.max_members) * 100"></div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs" style="margin-bottom:20px;">
          @for (tab of tabs; track tab) {
            <button class="tab-btn" [class.active]="activeTab() === tab" (click)="activeTab.set(tab)" [id]="'tab-'+tab.toLowerCase()">{{ tab }}</button>
          }
        </div>

        @if (activeTab() === 'Overview') {
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <div class="glass-card" style="padding:24px;">
              <h3 style="font-size:15px;font-weight:700;margin-bottom:16px;">ℹ️ Details</h3>
              <div class="info-row"><span>Start Date</span><span>{{ fmt(committee()!.start_date) }}</span></div>
              <div class="info-row"><span>Payment Deadline</span><span>{{ committee()!.payment_deadline }}th of month</span></div>
              <div class="info-row"><span>Payment Method</span><span>{{ committee()!.payment_method }}</span></div>
              <div class="info-row"><span>IBAN</span><span style="font-family:monospace;font-size:11px;">{{ committee()!.iban }}</span></div>
            </div>
            <div class="glass-card" style="padding:24px;">
              <h3 style="font-size:15px;font-weight:700;margin-bottom:16px;">📜 Rules</h3>
              <p style="color:#94a3b8;font-size:13px;line-height:1.8;white-space:pre-wrap;">{{ committee()!.rules || 'No rules defined.' }}</p>
            </div>
          </div>
        }

        @if (activeTab() === 'Members') {
          <div class="glass-card" style="overflow:hidden;">
            <table class="data-table">
              <thead><tr><th>#</th><th>Member</th><th>Status</th><th>Reputation</th><th>Joined</th></tr></thead>
              <tbody>
                @for (m of approvedMembers(); track m.id) {
                  <tr>
                    <td><span style="font-weight:700;color:#818cf8;">{{ m.position }}</span></td>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px;">
                        <div class="av">{{ getInitials(m.profiles?.full_name || 'U') }}</div>
                        <div><p style="font-weight:600;font-size:13px;">{{ m.profiles?.full_name }}</p><p style="color:#94a3b8;font-size:11px;">{{ m.profiles?.email }}</p></div>
                      </div>
                    </td>
                    <td><span class="badge badge-{{m.status}}">{{ m.status }}</span></td>
                    <td><span style="color:#fbbf24;">⭐ {{ m.profiles?.reputation_score ?? 100 }}</span></td>
                    <td style="color:#94a3b8;font-size:12px;">{{ fmt(m.joined_at) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (activeTab() === 'Payments') {
          <div class="glass-card" style="overflow:hidden;">
            @if (payments().length === 0) {
              <div style="text-align:center;padding:40px;"><p style="color:#94a3b8;">No payments yet.</p></div>
            } @else {
              <table class="data-table">
                <thead><tr><th>Member</th><th>Month</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  @for (p of payments(); track p.id) {
                    <tr>
                      <td style="font-weight:600;font-size:13px;">{{ p.committee_members?.profiles?.full_name || '—' }}</td>
                      <td style="color:#94a3b8;">Month {{ p.month_number }}</td>
                      <td style="color:#34d399;font-weight:600;">PKR {{ p.amount.toLocaleString() }}</td>
                      <td><span class="badge badge-{{p.status}}">{{ p.status }}</span></td>
                      <td style="color:#94a3b8;font-size:12px;">{{ p.paid_at ? fmt(p.paid_at) : '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        }

        @if (activeTab() === 'Timeline') {
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;">
            @for (slot of schedule(); track slot.id) {
              <div class="timeline-card glass-card" [class.completed]="slot.status==='paid'">
                <p style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Month {{ slot.month_number }}</p>
                <p style="font-size:13px;font-weight:600;margin:6px 0 4px;">{{ fmt(slot.payout_date) }}</p>
                <p style="font-size:12px;color:#94a3b8;">{{ slot.committee_members?.profiles?.full_name || 'Pending' }}</p>
                <p style="font-size:14px;font-weight:700;color:#34d399;margin-top:4px;">PKR {{ (slot.payout_amount || 0).toLocaleString() }}</p>
                <span class="badge badge-{{slot.status}}" style="margin-top:8px;display:inline-flex;">{{ slot.status }}</span>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .tabs { display:flex;gap:4px;background:rgba(15,23,42,0.5);border-radius:12px;padding:4px;width:fit-content; }
    .tab-btn { background:none;border:none;color:#94a3b8;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s; }
    .tab-btn.active { background:rgba(99,102,241,0.2);color:#818cf8; }
    .info-row { display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(99,102,241,0.08);font-size:13px;color:#94a3b8; }
    .info-row span:last-child { color:#f1f5f9;font-weight:500; }
    .av { width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#10b981);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;flex-shrink:0; }
    .timeline-card { padding:16px;text-align:center; }
    .timeline-card.completed { opacity:0.6; }
    @media(max-width:768px) { [style*="grid-template-columns:repeat(4"] { grid-template-columns:repeat(2,1fr) !important; } [style*="1fr 1fr"] { grid-template-columns:1fr !important; } }
  `]
})
export class CommitteeDetailComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  committeeService = inject(CommitteeService);
  paymentService = inject(PaymentService);
  auth = inject(AuthService);
  toast = inject(ToastService);

  loading = signal(true);
  joining = signal(false);
  committee = signal<Committee | null>(null);
  members = signal<CommitteeMember[]>([]);
  payments = signal<Payment[]>([]);
  schedule = signal<any[]>([]);
  myInstallment = signal<MyCommitteeInstallmentSummary | null>(null);
  activeTab = signal('Overview');
  tabs = ['Overview', 'Members', 'Payments', 'Timeline'];
  private ch: any;

  approvedMembers = () => this.members().filter(m => m.status === 'approved');
  isAdmin = () => this.committee()?.creator_id === this.auth.currentUser?.id;
  isMember = () => this.members().some(m => m.user_id === this.auth.currentUser?.id);
  myMembership = () => this.members().find(m => m.user_id === this.auth.currentUser?.id);
  getInitials(n: string) { return n?.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) || 'U'; }
  fmt(d: string) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'; }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    const [c, m, p, s] = await Promise.all([
      this.committeeService.getCommitteeById(id),
      this.committeeService.getMembers(id),
      this.paymentService.getPaymentsForCommittee(id),
      this.committeeService.getPayoutSchedule(id),
    ]);
    this.committee.set(c); this.members.set(m); this.payments.set(p); this.schedule.set(s);
    await this.refreshMyInstallmentSummary(id);
    this.loading.set(false);
    this.ch = this.committeeService.subscribeToCommittee(id, async () => {
      const [nm, np] = await Promise.all([this.committeeService.getMembers(id), this.paymentService.getPaymentsForCommittee(id)]);
      this.members.set(nm); this.payments.set(np);
      await this.refreshMyInstallmentSummary(id);
    });
  }

  private async refreshMyInstallmentSummary(committeeId: string) {
    const rows = await this.paymentService.getMyInstallmentSummaries();
    this.myInstallment.set(rows.find(r => r.committee_id === committeeId) ?? null);
  }

  ngOnDestroy() { if (this.ch) this.committeeService['supabase'].client.removeChannel(this.ch); }

  async requestJoin() {
    this.joining.set(true);
    const { error } = await this.committeeService.requestJoin(this.committee()!.id);
    if (error) this.toast.error(error);
    else { this.toast.success('Request sent! Awaiting admin approval.'); const m = await this.committeeService.getMembers(this.committee()!.id); this.members.set(m); }
    this.joining.set(false);
  }
}
