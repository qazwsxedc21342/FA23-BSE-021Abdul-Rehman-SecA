import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, AppNotification } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-fade-in">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <div>
          <h2 style="font-size:20px;font-weight:700;">Notifications</h2>
          <p style="color:#94a3b8;font-size:14px;">{{ notifService.unreadCount() }} unread notifications</p>
        </div>
        @if (notifService.unreadCount() > 0) {
          <button class="btn-secondary" (click)="markAllRead()" id="mark-all-read">✓ Mark all as read</button>
        }
      </div>

      @if (notifService.notifications().length === 0) {
        <div class="glass-card" style="padding:60px;text-align:center;">
          <div style="font-size:56px;margin-bottom:16px;">🔔</div>
          <h3 style="font-size:18px;font-weight:700;margin-bottom:8px;">All caught up!</h3>
          <p style="color:#94a3b8;font-size:14px;">No notifications yet.</p>
        </div>
      } @else {
        <div style="display:flex;flex-direction:column;gap:10px;">
          @for (n of notifService.notifications(); track n.id) {
            <div class="notif-card glass-card" [class.unread]="!n.is_read" (click)="markRead(n)">
              <div class="notif-icon-lg">{{ getIcon(n.type) }}</div>
              <div style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
                  <p style="font-weight:600;font-size:14px;">{{ n.title }}</p>
                  <span style="color:#64748b;font-size:11px;flex-shrink:0;">{{ timeAgo(n.created_at) }}</span>
                </div>
                <p style="color:#94a3b8;font-size:13px;margin-top:2px;line-height:1.5;">{{ n.message }}</p>
                <span class="badge badge-{{n.type}}" style="margin-top:8px;display:inline-flex;">{{ n.type }}</span>
              </div>
              @if (!n.is_read) { <div class="unread-dot"></div> }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .notif-card { padding:18px 20px;display:flex;align-items:flex-start;gap:14px;cursor:pointer;transition:all 0.2s; }
    .notif-card.unread { border-color:rgba(99,102,241,0.3);background:rgba(99,102,241,0.05); }
    .notif-card:hover { transform:translateX(3px); }
    .notif-icon-lg { font-size:28px;flex-shrink:0;width:36px;text-align:center; }
    .unread-dot { width:8px;height:8px;border-radius:50%;background:#6366f1;flex-shrink:0;margin-top:6px; }
    .badge-payment { background:rgba(16,185,129,0.15);color:#34d399;border:1px solid rgba(16,185,129,0.3); }
    .badge-committee { background:rgba(99,102,241,0.15);color:#818cf8;border:1px solid rgba(99,102,241,0.3); }
    .badge-member { background:rgba(245,158,11,0.15);color:#fbbf24;border:1px solid rgba(245,158,11,0.3); }
    .badge-system { background:rgba(148,163,184,0.15);color:#94a3b8;border:1px solid rgba(148,163,184,0.3); }
  `]
})
export class NotificationsComponent {
  notifService = inject(NotificationService);
  auth = inject(AuthService);
  toast = inject(ToastService);

  getIcon(type: string) {
    const map: Record<string, string> = { payment: '💳', committee: '👥', member: '👤', system: '🔔' };
    return map[type] ?? '🔔';
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  async markRead(n: AppNotification) {
    if (!n.is_read) await this.notifService.markAsRead(n.id);
  }

  async markAllRead() {
    const uid = this.auth.currentUser?.id;
    if (uid) { await this.notifService.markAllAsRead(uid); this.toast.success('All marked as read'); }
  }
}
