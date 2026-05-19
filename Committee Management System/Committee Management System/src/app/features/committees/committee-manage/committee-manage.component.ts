import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CommitteeService, Committee, CommitteeMember } from '../../../core/services/committee.service';
import { PaymentService, Payment } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-committee-manage',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="animate-fade-in" style="max-width:960px;">
      <div style="margin-bottom:20px;">
        <a [routerLink]="['/committees', committeeId()]" style="color:#94a3b8;font-size:13px;text-decoration:none;">← Back to Committee</a>
        <h2 style="font-size:20px;font-weight:700;margin-top:8px;">Manage Committee</h2>
        @if (committee()) { <p style="color:#94a3b8;font-size:14px;">{{ committee()!.name }}</p> }
      </div>

      <!-- Committee Summary Stats -->
      @if (committee()) {
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;">
          <div class="glass-card" style="padding:18px;text-align:center;">
            <p style="color:#94a3b8;font-size:11px;margin-bottom:4px;">Total Months</p>
            <p style="font-size:24px;font-weight:800;color:#818cf8;">{{ committee()!.duration_months }}</p>
          </div>
          <div class="glass-card" style="padding:18px;text-align:center;">
            <p style="color:#94a3b8;font-size:11px;margin-bottom:4px;">Current Month</p>
            <p style="font-size:24px;font-weight:800;color:#6366f1;">{{ currentMonth() }}</p>
          </div>
          <div class="glass-card" style="padding:18px;text-align:center;">
            <p style="color:#94a3b8;font-size:11px;margin-bottom:4px;">Total Collected</p>
            <p style="font-size:20px;font-weight:800;color:#34d399;">PKR {{ totalCollected().toLocaleString() }}</p>
          </div>
          <div class="glass-card" style="padding:18px;text-align:center;">
            <p style="color:#94a3b8;font-size:11px;margin-bottom:4px;">Installments completed</p>
            <p style="font-size:24px;font-weight:800;color:#f59e0b;">{{ totalInstallmentsPaid() }} / {{ installmentSlotsTotal() }}</p>
            <p style="color:#64748b;font-size:10px;margin-top:6px;">{{ approvedMembers().length }} members × {{ committee()!.duration_months }} months</p>
          </div>
        </div>
      }

      <!-- Pending Requests -->
      <div class="glass-card" style="padding:24px; margin-bottom:20px;">
        <h3 style="font-size:16px;font-weight:700;margin-bottom:16px;">⏳ Pending Join Requests ({{ pendingMembers().length }})</h3>
        @if (pendingMembers().length === 0) {
          <p style="color:#94a3b8;font-size:13px;">No pending requests.</p>
        } @else {
          <div style="display:flex;flex-direction:column;gap:12px;">
            @for (m of pendingMembers(); track m.id) {
              <div class="member-row">
                <div class="avatar-sm">{{ getInitials(m.profiles?.full_name || 'U') }}</div>
                <div style="flex:1;">
                  <p style="font-weight:600;font-size:14px;">{{ m.profiles?.full_name }}</p>
                  <p style="color:#94a3b8;font-size:12px;">{{ m.profiles?.email }} • ⭐ {{ m.profiles?.reputation_score ?? 100 }}</p>
                </div>
                <div style="display:flex;gap:8px;">
                  <button class="btn-success" style="padding:6px 14px;font-size:12px;" (click)="approveMember(m.id)" [id]="'approve-'+m.id">✓ Approve</button>
                  <button class="btn-danger" style="padding:6px 14px;font-size:12px;" (click)="rejectMember(m.id)" [id]="'reject-'+m.id">✕ Reject</button>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Member Payment Records (Full Detail) -->
      <div class="glass-card" style="padding:24px; margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <div>
            <h3 style="font-size:16px;font-weight:700;">📊 Detailed Member Payment Records</h3>
            <p style="color:#94a3b8;font-size:12px;margin-top:4px;">Comprehensive record of installments paid, remaining, and overdue</p>
          </div>
          @if (paymentsLoading()) {
            <span style="font-size:12px;color:#6366f1;display:flex;align-items:center;gap:6px;">
              <div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Updating...
            </span>
          }
        </div>

        @for (m of approvedMembers(); track m.id) {
          <div class="member-payment-card">
            <!-- Member Header -->
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap;">
              <div class="avatar-sm">{{ getInitials(m.profiles?.full_name || 'U') }}</div>
              <div style="flex:1;">
                <p style="font-weight:700;font-size:14px;">{{ m.profiles?.full_name }}</p>
                <p style="color:#94a3b8;font-size:11px;">Position #{{ m.position }} • {{ m.profiles?.email }}</p>
              </div>
              <!-- Detailed Stats chips -->
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <span class="stat-chip green" title="Total Amount Paid">
                  💰 PKR {{ getMemberTotalPaid(m.id).toLocaleString() }} Paid ({{ getMemberPaidCount(m.id) }} inst.)
                </span>
                <span class="stat-chip blue" title="Remaining Amount">
                  ⏳ PKR {{ getMemberRemainingAmount(m.id).toLocaleString() }} Remaining ({{ getMemberRemainingCount(m.id) }} inst.)
                </span>
                @if (getMemberProcessingCount(m.id) > 0) {
                  <span class="stat-chip yellow" title="Payment started, not completed yet">
                    ⏳ {{ getMemberProcessingCount(m.id) }} processing
                  </span>
                }
                @if (getMemberOverdueCount(m.id) > 0) {
                  <span class="stat-chip red" title="Overdue Installments (upto current month)">
                    ⚠️ {{ getMemberOverdueCount(m.id) }} Overdue
                  </span>
                }
              </div>
            </div>

            <!-- Progress Bar -->
            <div style="margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-bottom:4px;">
                <span>Overall Payment Progress</span>
                <span>{{ getProgressPct(m.id) }}% ({{ getMemberPaidCount(m.id) }} / {{ getCommitteeDuration() }} months)</span>
              </div>
              <div style="background:rgba(99,102,241,0.1);border-radius:8px;height:8px;overflow:hidden;">
                <div style="height:100%;border-radius:8px;background:linear-gradient(90deg,#6366f1,#10b981);transition:width 0.4s ease;"
                  [style.width]="getProgressPct(m.id) + '%'"></div>
              </div>
            </div>

            <!-- Month-by-month pills (Full Duration Timeline) -->
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              @for (month of getMonthRange(); track month) {
                <div class="month-pill"
                  [class.paid]="hasPaid(m.id, month)"
                  [class.unpaid]="!hasPaid(m.id, month) && month <= currentMonth()"
                  [class.future]="!hasPaid(m.id, month) && month > currentMonth()"
                  [class.current]="getFirstUnpaidMonth(m.id) === month"
                  [title]="'Month ' + month + ': ' + (hasPaid(m.id, month) ? 'Paid' : (month <= currentMonth() ? 'Overdue/Pending' : 'Future'))">
                  M{{ month }}
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Active Members List -->
      <div class="glass-card" style="padding:24px; margin-bottom:20px;">
        <h3 style="font-size:16px;font-weight:700;margin-bottom:16px;">✅ Active Members ({{ approvedMembers().length }})</h3>
        <table class="data-table">
          <thead><tr><th>Pos</th><th>Member</th><th>Phone</th><th>Reputation</th><th>Actions</th></tr></thead>
          <tbody>
            @for (m of approvedMembers(); track m.id) {
              <tr>
                <td><span style="font-weight:700;color:#818cf8;">#{{ m.position }}</span></td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <div class="avatar-sm">{{ getInitials(m.profiles?.full_name || 'U') }}</div>
                    <div>
                      <p style="font-weight:600;font-size:13px;">{{ m.profiles?.full_name }}</p>
                      <p style="color:#94a3b8;font-size:11px;">{{ m.profiles?.email }}</p>
                    </div>
                  </div>
                </td>
                <td style="color:#94a3b8;font-size:13px;">{{ m.profiles?.phone || '—' }}</td>
                <td><span style="color:#fbbf24;">⭐ {{ m.profiles?.reputation_score ?? 100 }}</span></td>
                <td>
                  @if (m.user_id !== auth.currentUser?.id) {
                    <button class="btn-danger" style="padding:4px 10px;font-size:12px;" (click)="removeMember(m.id)" [id]="'rm-'+m.id">Remove</button>
                  } @else {
                    <span style="color:#64748b;font-size:12px;">You (Admin)</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Committee Status Control -->
      <div class="glass-card" style="padding:24px;">
        <h3 style="font-size:16px;font-weight:700;margin-bottom:16px;">⚙️ Committee Status</h3>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn-success" (click)="updateStatus('active')" [disabled]="committee()?.status === 'active'" id="status-active">Set Active</button>
          <button class="btn-secondary" (click)="updateStatus('open')" [disabled]="committee()?.status === 'open'" id="status-open">Set Open</button>
          <button class="btn-danger" (click)="updateStatus('cancelled')" [disabled]="committee()?.status === 'cancelled'" id="status-cancel">Cancel Committee</button>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin-top:12px;">Current status: <strong style="color:#f1f5f9;">{{ committee()?.status }}</strong></p>
      </div>
    </div>
  `,
  styles: [`
    .member-row { display:flex;align-items:center;gap:12px;padding:14px;background:rgba(15,23,42,0.5);border-radius:10px;border:1px solid rgba(99,102,241,0.08); }
    .avatar-sm { width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#10b981);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0; }
    .member-payment-card { background:rgba(15,23,42,0.5);border:1px solid rgba(99,102,241,0.1);border-radius:12px;padding:18px;margin-bottom:16px; }
    .member-payment-card:last-child { margin-bottom:0; }
    .stat-chip { padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600; display:flex; align-items:center; gap:4px; }
    .stat-chip.green { background:rgba(16,185,129,0.12);color:#34d399; }
    .stat-chip.yellow { background:rgba(245,158,11,0.12);color:#fbbf24; }
    .stat-chip.blue { background:rgba(99,102,241,0.12);color:#818cf8; }
    .stat-chip.red { background:rgba(239,68,68,0.12);color:#ef4444; }
    .month-pill { width:36px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;cursor:default;transition:transform 0.15s; }
    .month-pill:hover { transform:scale(1.15); }
    .month-pill.paid { background:rgba(16,185,129,0.2);color:#34d399;border:1px solid rgba(16,185,129,0.3); }
    .month-pill.unpaid { background:rgba(239,68,68,0.12);color:#fca5a5;border:1px solid rgba(239,68,68,0.2); }
    .month-pill.future { background:rgba(255,255,255,0.05);color:#94a3b8;border:1px dashed rgba(255,255,255,0.1); }
    .month-pill.current { border:2px solid #6366f1; }
  `]
})
export class CommitteeManageComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  committeeService = inject(CommitteeService);
  paymentService = inject(PaymentService);
  auth = inject(AuthService);
  toast = inject(ToastService);
  supabase = inject(SupabaseService);

  committeeId = signal('');
  committee = signal<Committee | null>(null);
  members = signal<CommitteeMember[]>([]);
  committeePayments = signal<Payment[]>([]);
  paymentsLoading = signal(false);
  currentMonth = signal(1);
  private realtimeChannel: any;

  pendingMembers  = () => this.members().filter(m => m.status === 'pending');
  approvedMembers = () => this.members().filter(m => m.status === 'approved');

  // Robust Payment Logic Helpers
  getCommitteeDuration() { return this.committee()?.duration_months || 1; }
  getMonthlyAmount() { return this.committee()?.monthly_amount || 0; }

  getMemberPayments(memberId: string) {
    return this.committeePayments().filter(p => p.member_id === memberId && p.status === 'completed');
  }
  getMemberPaidCount(memberId: string) {
    return this.getMemberPayments(memberId).length;
  }
  getMemberTotalPaid(memberId: string) {
    return this.getMemberPayments(memberId).reduce((s, p) => s + Number(p.amount), 0);
  }

  getMemberRemainingCount(memberId: string) {
    return Math.max(0, this.getCommitteeDuration() - this.getMemberPaidCount(memberId));
  }
  getMemberRemainingAmount(memberId: string) {
    const commitment = this.getCommitteeDuration() * Number(this.getMonthlyAmount());
    return Math.max(0, commitment - this.getMemberTotalPaid(memberId));
  }

  getMemberProcessingCount(memberId: string) {
    return this.committeePayments().filter(p => p.member_id === memberId && p.status === 'processing').length;
  }
  
  getMemberOverdueCount(memberId: string) { return Math.max(0, this.currentMonth() - this.getMemberPaidCount(memberId)); }

  hasPaid(memberId: string, month: number) {
    return this.committeePayments().some(
      p =>
        p.member_id === memberId &&
        Number(p.month_number) === Number(month) &&
        p.status === 'completed'
    );
  }

  /** Next installment this member still owes (for highlighting M2 after M1 is paid). */
  getFirstUnpaidMonth(memberId: string): number | null {
    const dur = this.getCommitteeDuration();
    for (let m = 1; m <= dur; m++) {
      if (!this.hasPaid(memberId, m)) return m;
    }
    return null;
  }
  getProgressPct(memberId: string) {
    return Math.round((this.getMemberPaidCount(memberId) / this.getCommitteeDuration()) * 100);
  }
  getMonthRange() {
    return Array.from({ length: this.getCommitteeDuration() }, (_, i) => i + 1);
  }
  
  totalCollected() {
    return this.committeePayments()
      .filter(p => p.status === 'completed')
      .reduce((s, p) => s + Number(p.amount), 0);
  }
  totalInstallmentsPaid() {
    return this.committeePayments().filter(p => p.status === 'completed').length;
  }
  installmentSlotsTotal() {
    return this.approvedMembers().length * this.getCommitteeDuration();
  }
  getInitials(name: string) { return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'; }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.committeeId.set(id);
    const [c, m] = await Promise.all([
      this.committeeService.getCommitteeById(id),
      this.committeeService.getMembers(id)
    ]);
    this.committee.set(c);
    this.members.set(m);
    if (c?.start_date) {
      const start = new Date(c.start_date);
      const now = new Date();
      const diff = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth() + 1;
      this.currentMonth.set(Math.max(1, Math.min(diff, c.duration_months || 1)));
    }
    await this.loadPayments();
    this.subscribeToPayments();
  }

  ngOnDestroy() {
    if (this.realtimeChannel) this.supabase.client.removeChannel(this.realtimeChannel);
  }

  async loadPayments() {
    const data = await this.paymentService.getPaymentsForCommittee(this.committeeId());
    this.committeePayments.set(data);
  }

  subscribeToPayments() {
    this.realtimeChannel = this.supabase.client
      .channel(`manage-payments-${this.committeeId()}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payments', filter: `committee_id=eq.${this.committeeId()}` },
        async () => { this.paymentsLoading.set(true); await this.loadPayments(); this.paymentsLoading.set(false); }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'payments', filter: `committee_id=eq.${this.committeeId()}` },
        async () => { this.paymentsLoading.set(true); await this.loadPayments(); this.paymentsLoading.set(false); }
      )
      .subscribe();
  }

  async reload() { const m = await this.committeeService.getMembers(this.committeeId()); this.members.set(m); }

  async approveMember(id: string) {
    const { error } = await this.committeeService.approveRejectMember(id, true);
    if (error) this.toast.error(error); else { this.toast.success('Member approved!'); await this.reload(); }
  }

  async rejectMember(id: string) {
    const { error } = await this.committeeService.approveRejectMember(id, false);
    if (error) this.toast.error(error); else { this.toast.success('Member rejected'); await this.reload(); }
  }

  async removeMember(id: string) {
    const { error } = await this.committeeService.removeMember(id);
    if (error) this.toast.error(error); else { this.toast.success('Member removed'); await this.reload(); }
  }

  async updateStatus(status: string) {
    const { error } = await this.committeeService.updateStatus(this.committeeId(), status);
    if (error) this.toast.error(error);
    else { this.toast.success('Status updated'); const c = await this.committeeService.getCommitteeById(this.committeeId()); this.committee.set(c); }
  }
}
