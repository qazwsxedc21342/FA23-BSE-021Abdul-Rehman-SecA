import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { CommitteeService, Committee } from '../../core/services/committee.service';
import { PaymentService } from '../../core/services/payment.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="animate-fade-in">
      <!-- Welcome Banner -->
      <div class="welcome-banner glass-card" style="margin-bottom:24px;">
        <div>
          <h2 style="font-size:22px;font-weight:700;margin-bottom:4px;">
            Good {{ greeting() }}, {{ getName() }}! 👋
          </h2>
          <p style="color:#94a3b8;font-size:14px;">Here's your financial committee overview</p>
        </div>
        <a routerLink="/committees/create" class="btn-primary" id="dashboard-create-btn">＋ Create Committee</a>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid" style="margin-bottom:24px;">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(99,102,241,0.15);color:#818cf8;">👥</div>
          <div class="stat-value">{{ myCommittees().length }}</div>
          <div class="stat-label">Active Committees</div>
          <div class="stat-trend">{{ createdCommittees().length }} created · {{ joinedCommittees().length }} joined</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:#34d399;">💰</div>
          <div class="stat-value">PKR {{ formatAmt(stats().totalPaid) }}</div>
          <div class="stat-label">Total Paid</div>
          <div class="stat-trend">{{ stats().installmentsCompleted }} completed installment(s)</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(99,102,241,0.15);color:#818cf8;">📆</div>
          <div class="stat-value">{{ stats().installmentsCompleted }} / {{ stats().installmentSlotsTotal }}</div>
          <div class="stat-label">Installments progress</div>
          <div class="stat-trend">{{ stats().installmentsRemaining }} month(s) left · {{ stats().installmentsInProgress }} processing</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:#fbbf24;">📅</div>
          <div class="stat-value">{{ stats().pending + stats().processing }}</div>
          <div class="stat-label">Not finalized</div>
          <div class="stat-trend">{{ stats().pending }} pending · {{ stats().processing }} processing{{ stats().failed ? ' · ' + stats().failed + ' failed' : '' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(99,102,241,0.15);color:#818cf8;">⭐</div>
          <div class="stat-value">{{ getRepScore() }}</div>
          <div class="stat-label">Reputation Score</div>
          <div class="stat-trend">{{ getRepLabel(getRepScore()) }}</div>
        </div>
      </div>

      <!-- Two columns -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
        <!-- My Committees -->
        <div class="glass-card" style="padding:24px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h3 style="font-size:16px;font-weight:700;">My Committees</h3>
            <a routerLink="/committees" style="color:#6366f1;font-size:13px;text-decoration:none;">View all →</a>
          </div>
          @if (loading()) {
            <div class="page-loader"><div class="spinner"></div></div>
          } @else if (myCommittees().length === 0) {
            <div style="text-align:center;padding:24px;">
              <span style="font-size:40px;">🏘️</span>
              <p style="color:#94a3b8;margin-top:8px;font-size:14px;">No committees yet</p>
              <a routerLink="/committees" class="btn-secondary" style="margin-top:12px;font-size:12px;">Browse</a>
            </div>
          } @else {
            <div style="display:flex;flex-direction:column;gap:10px;">
              @for (c of myCommittees().slice(0, 5); track c.id) {
                <a [routerLink]="['/committees', c.id]" style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;background:rgba(15,23,42,0.5);border:1px solid rgba(99,102,241,0.08);text-decoration:none;color:inherit;transition:all 0.2s;">
                  <div style="flex:1;overflow:hidden;">
                    <p style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ c.name }}</p>
                    <p style="color:#94a3b8;font-size:12px;margin-top:2px;">{{ c.current_members }}/{{ c.max_members }} · PKR {{ c.monthly_amount.toLocaleString() }}/mo</p>
                  </div>
                  <span class="badge badge-{{c.status}}">{{ c.status }}</span>
                </a>
              }
            </div>
          }
        </div>

        <!-- Recent Notifications -->
        <div class="glass-card" style="padding:24px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h3 style="font-size:16px;font-weight:700;">Recent Activity</h3>
            <a routerLink="/notifications" style="color:#6366f1;font-size:13px;text-decoration:none;">See all →</a>
          </div>
          @if (notifService.notifications().length === 0) {
            <div style="text-align:center;padding:24px;">
              <span style="font-size:40px;">🔔</span>
              <p style="color:#94a3b8;margin-top:8px;font-size:14px;">No notifications yet</p>
            </div>
          } @else {
            <div style="display:flex;flex-direction:column;gap:10px;">
              @for (n of notifService.notifications().slice(0, 5); track n.id) {
                <div style="display:flex;align-items:flex-start;gap:10px;padding:10px;border-radius:8px;" [style.background]="!n.is_read ? 'rgba(99,102,241,0.06)' : 'transparent'">
                  <span style="font-size:20px;flex-shrink:0;">{{ getNotifIcon(n.type) }}</span>
                  <div style="flex:1;overflow:hidden;">
                    <p style="font-size:13px;font-weight:500;">{{ n.title }}</p>
                    <p style="color:#94a3b8;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ n.message }}</p>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .welcome-banner { padding:24px 28px;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(16,185,129,0.08));flex-wrap:wrap;gap:16px; }
    .stats-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:16px; }
    .stat-card { background:rgba(30,41,59,0.7);border:1px solid rgba(99,102,241,0.15);border-radius:16px;padding:20px;text-align:center;transition:transform 0.2s; }
    .stat-card:hover { transform:translateY(-2px); }
    .stat-icon { width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 12px; }
    .stat-value { font-size:20px;font-weight:800;margin-bottom:4px; }
    .stat-label { color:#94a3b8;font-size:12px;font-weight:500;margin-bottom:4px; }
    .stat-trend { color:#64748b;font-size:11px; }
    @media(max-width:900px) { .stats-grid { grid-template-columns:repeat(2,1fr); } }
    @media(max-width:600px) { [style*="grid-template-columns:1fr 1fr"] { grid-template-columns:1fr !important; } }
  `]
})
export class DashboardComponent implements OnInit {
  private auth: AuthService = inject(AuthService);
  notifService: NotificationService = inject(NotificationService);
  private committeeService: CommitteeService = inject(CommitteeService);
  private paymentService: PaymentService = inject(PaymentService);

  loading = signal(true);
  createdCommittees = signal<Committee[]>([]);
  joinedCommittees = signal<Committee[]>([]);
  stats = signal({
    totalPaid: 0,
    pending: 0,
    processing: 0,
    failed: 0,
    completed: 0,
    installmentsCompleted: 0,
    installmentsRemaining: 0,
    installmentsInProgress: 0,
    installmentSlotsTotal: 0
  });

  myCommittees = () => {
    const created = this.createdCommittees();
    const joined = this.joinedCommittees().filter(j => !created.find(c => c.id === j.id));
    return [...created, ...joined];
  };

  greeting() { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'; }
  getName() { return (this.auth.currentProfile as any)?.full_name?.split(' ')[0] || 'there'; }
  getRepScore() { return (this.auth.currentProfile as any)?.reputation_score ?? 100; }
  formatAmt(n: number) { return (n || 0).toLocaleString(); }
  getRepLabel(s: number) { if (s >= 150) return '🌟 Excellent'; if (s >= 100) return '✅ Good'; if (s >= 50) return '⚠️ Fair'; return '❌ Poor'; }
  getNotifIcon(type: string) { const m: Record<string, string> = { payment: '💳', committee: '👥', member: '👤', system: '🔔' }; return m[type] ?? '🔔'; }

  async ngOnInit() {
    const { created, joined } = await this.committeeService.getMyCommittees();
    this.createdCommittees.set(created);
    this.joinedCommittees.set(joined);
    const uid = (this.auth.currentUser as any)?.id;
    if (uid) { const s = await this.paymentService.getPaymentStats(uid); this.stats.set(s); }
    this.loading.set(false);
  }
}
