import { Component, signal, inject, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-shell" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Sidebar -->
      <aside class="sidebar" [class.mobile-open]="mobileSidebarOpen()">
        <div class="sidebar-header">
          <div class="logo">
            <span class="logo-icon">💎</span>
            @if (!sidebarCollapsed()) {
              <span class="logo-text gradient-text">CommitteeHub</span>
            }
          </div>
          <button class="collapse-btn" (click)="sidebarCollapsed.set(!sidebarCollapsed())" title="Toggle sidebar">
            {{ sidebarCollapsed() ? '→' : '←' }}
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="nav-active" class="nav-item" id="nav-dashboard" (click)="closeMobile()">
            <span class="nav-icon">🏠</span>
            @if (!sidebarCollapsed()) { <span>Dashboard</span> }
          </a>
          <a routerLink="/committees" routerLinkActive="nav-active" class="nav-item" id="nav-committees" (click)="closeMobile()">
            <span class="nav-icon">👥</span>
            @if (!sidebarCollapsed()) { <span>Committees</span> }
          </a>
          <a routerLink="/payment-history" routerLinkActive="nav-active" class="nav-item" id="nav-payments" (click)="closeMobile()">
            <span class="nav-icon">💳</span>
            @if (!sidebarCollapsed()) { <span>Payments</span> }
          </a>
          <a routerLink="/notifications" routerLinkActive="nav-active" class="nav-item" id="nav-notifications" (click)="closeMobile()">
            <span class="nav-icon">🔔</span>
            @if (!sidebarCollapsed()) { <span>Notifications</span> }
            @if (notifService.unreadCount() > 0) {
              <span class="badge-dot">{{ notifService.unreadCount() }}</span>
            }
          </a>
          <a routerLink="/profile" routerLinkActive="nav-active" class="nav-item" id="nav-profile" (click)="closeMobile()">
            <span class="nav-icon">👤</span>
            @if (!sidebarCollapsed()) { <span>Profile</span> }
          </a>
        </nav>

        <div class="sidebar-footer">
          @if (auth.currentProfile) {
            <div class="user-info" [class.collapsed]="sidebarCollapsed()">
              <div class="user-avatar">{{ getInitials(auth.currentProfile.full_name) }}</div>
              @if (!sidebarCollapsed()) {
                <div style="flex:1; overflow:hidden;">
                  <p style="font-weight:600; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ auth.currentProfile.full_name }}</p>
                  <p style="color:#94a3b8; font-size:11px;">⭐ {{ auth.currentProfile.reputation_score }}</p>
                </div>
              }
            </div>
          }
          <button class="nav-item logout-btn" (click)="logout()" id="nav-logout">
            <span class="nav-icon">🚪</span>
            @if (!sidebarCollapsed()) { <span>Logout</span> }
          </button>
        </div>
      </aside>

      <!-- Mobile overlay -->
      @if (mobileSidebarOpen()) {
        <div class="mobile-overlay" (click)="mobileSidebarOpen.set(false)"></div>
      }

      <!-- Main content -->
      <div class="main-content">
        <header class="topbar">
          <button class="mobile-menu-btn" (click)="mobileSidebarOpen.set(!mobileSidebarOpen())" id="mobile-menu-btn">☰</button>
          <div class="topbar-title">
            <h2 style="font-size:18px; font-weight:700;">{{ getPageTitle() }}</h2>
          </div>
          <div class="topbar-actions">
            <a routerLink="/committees/create" class="btn-primary" style="font-size:13px; padding:8px 16px;" id="create-committee-btn">
              ＋ New Committee
            </a>
            <a routerLink="/notifications" style="position:relative; text-decoration:none;">
              <button class="icon-btn" id="notif-bell">🔔
                @if (notifService.unreadCount() > 0) {
                  <span class="notif-badge">{{ notifService.unreadCount() }}</span>
                }
              </button>
            </a>
          </div>
        </header>
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-shell { display:flex; height:100vh; overflow:hidden; }
    .sidebar { width:240px; background:rgba(15,23,42,0.95); border-right:1px solid rgba(99,102,241,0.15); display:flex; flex-direction:column; transition:width 0.3s ease; flex-shrink:0; z-index:100; }
    .sidebar-collapsed .sidebar { width:68px; }
    .sidebar-header { padding:20px 16px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(99,102,241,0.1); }
    .logo { display:flex; align-items:center; gap:10px; overflow:hidden; }
    .logo-icon { font-size:24px; flex-shrink:0; }
    .logo-text { font-size:16px; font-weight:800; white-space:nowrap; }
    .collapse-btn { background:none; border:1px solid rgba(99,102,241,0.2); color:#94a3b8; width:28px; height:28px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; transition:all 0.2s; }
    .collapse-btn:hover { background:rgba(99,102,241,0.1); color:#6366f1; }
    .sidebar-nav { flex:1; padding:16px 10px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; }
    .nav-item { display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:10px; color:#94a3b8; text-decoration:none; font-size:14px; font-weight:500; transition:all 0.2s; cursor:pointer; border:none; background:none; width:100%; position:relative; }
    .nav-item:hover { background:rgba(99,102,241,0.1); color:#c7d2fe; }
    .nav-active { background:rgba(99,102,241,0.15) !important; color:#818cf8 !important; }
    .nav-icon { font-size:18px; flex-shrink:0; width:24px; text-align:center; }
    .badge-dot { background:#6366f1; color:white; font-size:10px; font-weight:700; padding:2px 6px; border-radius:10px; margin-left:auto; }
    .sidebar-footer { padding:12px 10px; border-top:1px solid rgba(99,102,241,0.1); }
    .user-info { display:flex; align-items:center; gap:10px; padding:10px 12px; margin-bottom:4px; }
    .user-info.collapsed { justify-content:center; }
    .user-avatar { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#10b981); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:white; flex-shrink:0; }
    .logout-btn { color:#f87171 !important; }
    .logout-btn:hover { background:rgba(239,68,68,0.1) !important; }
    .main-content { flex:1; display:flex; flex-direction:column; overflow:hidden; }
    .topbar { height:64px; background:rgba(15,23,42,0.8); border-bottom:1px solid rgba(99,102,241,0.1); backdrop-filter:blur(12px); display:flex; align-items:center; padding:0 24px; gap:16px; flex-shrink:0; position:sticky; top:0; z-index:50; }
    .topbar-title { flex:1; }
    .topbar-actions { display:flex; align-items:center; gap:12px; }
    .icon-btn { background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); color:#94a3b8; width:38px; height:38px; border-radius:10px; cursor:pointer; font-size:18px; position:relative; display:flex; align-items:center; justify-content:center; }
    .notif-badge { position:absolute; top:-4px; right:-4px; background:#ef4444; color:white; font-size:9px; font-weight:700; padding:1px 4px; border-radius:8px; min-width:16px; text-align:center; }
    .page-content { flex:1; overflow-y:auto; padding:24px; }
    .mobile-menu-btn { display:none; background:none; border:1px solid rgba(99,102,241,0.2); color:#94a3b8; width:38px; height:38px; border-radius:10px; cursor:pointer; font-size:20px; align-items:center; justify-content:center; }
    .mobile-overlay { display:none; }
    @media (max-width: 768px) {
      .sidebar { position:fixed; left:-240px; height:100%; transition:left 0.3s ease; }
      .sidebar.mobile-open { left:0; }
      .sidebar-collapsed .sidebar { width:240px; }
      .mobile-menu-btn { display:flex; }
      .mobile-overlay { display:block; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:99; }
      .page-content { padding:16px; }
    }
  `]
})
export class ShellComponent {
  auth = inject(AuthService);
  notifService = inject(NotificationService);
  toast = inject(ToastService);
  router = inject(Router);
  sidebarCollapsed = signal(false);
  mobileSidebarOpen = signal(false);

  getInitials(name: string) { return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'; }
  closeMobile() { this.mobileSidebarOpen.set(false); }

  getPageTitle() {
    const url = this.router.url;
    if (url.includes('dashboard')) return 'Dashboard';
    if (url.includes('committees/create')) return 'Create Committee';
    if (url.includes('committees') && url.includes('manage')) return 'Manage Committee';
    if (url.includes('committees') && url.split('/').length > 3) return 'Committee Details';
    if (url.includes('committees')) return 'Committees';
    if (url.includes('payments')) return 'Payments';
    if (url.includes('notifications')) return 'Notifications';
    if (url.includes('profile')) return 'My Profile';
    return 'CommitteeHub';
  }

  async logout() {
    await this.auth.signOut();
    this.toast.info('Signed out successfully');
  }
}
