import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommitteeService, Committee } from '../../../core/services/committee.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-committee-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="animate-fade-in">
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
        <div>
          <h2 style="font-size:20px; font-weight:700;">Browse Committees</h2>
          <p style="color:#94a3b8; font-size:14px; margin-top:4px;">Find and join a committee that suits your budget</p>
        </div>
        <a routerLink="/committees/create" class="btn-primary" id="list-create-btn">＋ Create Committee</a>
      </div>

      <!-- Filters -->
      <div class="filters-bar glass-card" style="margin-bottom:20px;">
        <input class="form-input" style="max-width:280px;" [(ngModel)]="searchQuery" (ngModelChange)="applyFilters()" placeholder="🔍 Search committees..." id="committee-search">
        <div class="filter-pills">
          @for (s of statuses; track s.value) {
            <button class="filter-pill" [class.active]="activeStatus() === s.value" (click)="setStatus(s.value)" [id]="'filter-'+s.value">
              {{ s.label }}
            </button>
          }
        </div>
        <select class="form-input" style="max-width:200px;" [(ngModel)]="sortBy" (ngModelChange)="applyFilters()" id="committee-sort">
          <option value="newest">Newest First</option>
          <option value="amount_asc">Amount: Low → High</option>
          <option value="amount_desc">Amount: High → Low</option>
          <option value="members">Most Members</option>
        </select>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="page-loader"><div class="spinner"></div><p style="color:#94a3b8;">Loading committees...</p></div>
      }

      <!-- Grid -->
      @if (!loading()) {
        @if (filtered().length === 0) {
          <div style="text-align:center; padding:60px 20px;">
            <div style="font-size:64px; margin-bottom:16px;">🏘️</div>
            <h3 style="font-size:18px; font-weight:600; margin-bottom:8px;">No committees found</h3>
            <p style="color:#94a3b8;">Try adjusting your filters or create a new committee.</p>
            <a routerLink="/committees/create" class="btn-primary" style="margin-top:20px; display:inline-flex;">＋ Create First Committee</a>
          </div>
        } @else {
          <div class="committees-grid">
            @for (c of filtered(); track c.id) {
              <div class="committee-card glass-card animate-slide-up">
                <div class="card-header">
                  <span class="badge badge-{{c.status}}">{{ c.status }}</span>
                  <span style="color:#94a3b8; font-size:12px;">{{ formatDate(c.start_date) }}</span>
                </div>
                <h3 style="font-size:16px; font-weight:700; margin:12px 0 6px;">{{ c.name }}</h3>
                <p style="color:#94a3b8; font-size:13px; line-height:1.5; height:40px; overflow:hidden;">{{ c.description || 'No description provided.' }}</p>
                <div class="card-stats">
                  <div class="card-stat">
                    <span class="stat-icon-sm">💰</span>
                    <div>
                      <p style="font-weight:700; font-size:15px;">PKR {{ c.monthly_amount.toLocaleString() }}</p>
                      <p style="color:#94a3b8; font-size:11px;">per month</p>
                    </div>
                  </div>
                  <div class="card-stat">
                    <span class="stat-icon-sm">👥</span>
                    <div>
                      <p style="font-weight:700; font-size:15px;">{{ c.current_members }}/{{ c.max_members }}</p>
                      <p style="color:#94a3b8; font-size:11px;">members</p>
                    </div>
                  </div>
                  <div class="card-stat">
                    <span class="stat-icon-sm">📅</span>
                    <div>
                      <p style="font-weight:700; font-size:15px;">{{ c.duration_months }} mo</p>
                      <p style="color:#94a3b8; font-size:11px;">duration</p>
                    </div>
                  </div>
                </div>
                <div class="progress-bar" style="margin:14px 0 8px;">
                  <div class="progress-fill" [style.width.%]="(c.current_members / c.max_members) * 100"></div>
                </div>
                <p style="color:#94a3b8; font-size:12px; margin-bottom:16px;">{{ c.max_members - c.current_members }} spots remaining</p>
                <div style="display:flex; gap:8px;">
                  <a [routerLink]="['/committees', c.id]" class="btn-secondary" style="flex:1; justify-content:center; font-size:13px;" [id]="'view-'+c.id">View Details</a>
                  @if (c.status === 'open' && c.creator_id !== currentUserId()) {
                    <button class="btn-primary" style="flex:1; justify-content:center; font-size:13px;" (click)="joinCommittee(c)" [id]="'join-'+c.id">Join</button>
                  }
                  @if (c.creator_id === currentUserId()) {
                    <a [routerLink]="['/committees', c.id, 'manage']" class="btn-success" style="flex:1; justify-content:center; font-size:13px;" [id]="'manage-'+c.id">Manage</a>
                  }
                </div>
                <div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(99,102,241,0.1); display:flex; align-items:center; gap:8px;">
                  <div style="width:24px; height:24px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#10b981); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:white;">
                    {{ getInitials(c.profiles?.full_name || 'A') }}
                  </div>
                  <span style="font-size:12px; color:#94a3b8;">by {{ c.profiles?.full_name || 'Unknown' }}</span>
                  <span style="margin-left:auto; font-size:12px; color:#fbbf24;">⭐ {{ c.profiles?.reputation_score ?? 100 }}</span>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .filters-bar { padding:16px; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
    .filter-pills { display:flex; gap:6px; flex-wrap:wrap; }
    .filter-pill { background:rgba(99,102,241,0.05); border:1px solid rgba(99,102,241,0.15); color:#94a3b8; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:500; cursor:pointer; transition:all 0.2s; }
    .filter-pill.active { background:rgba(99,102,241,0.2); border-color:#6366f1; color:#818cf8; }
    .committees-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:20px; }
    .committee-card { padding:22px; transition:transform 0.2s, box-shadow 0.2s; }
    .committee-card:hover { transform:translateY(-3px); box-shadow:0 16px 40px rgba(0,0,0,0.3); }
    .card-header { display:flex; justify-content:space-between; align-items:center; }
    .card-stats { display:flex; gap:16px; margin-top:14px; }
    .card-stat { display:flex; align-items:center; gap:8px; flex:1; }
    .stat-icon-sm { font-size:20px; }
    @media(max-width:600px) { .filters-bar { flex-direction:column; align-items:stretch; } }
  `]
})
export class CommitteeListComponent implements OnInit {
  committeeService = inject(CommitteeService);
  auth = inject(AuthService);
  toast = inject(ToastService);

  loading = signal(true);
  committees = signal<Committee[]>([]);
  filtered = signal<Committee[]>([]);
  activeStatus = signal('all');
  searchQuery = '';
  sortBy = 'newest';

  statuses = [
    { label: 'All', value: 'all' },
    { label: 'Open', value: 'open' },
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
  ];

  currentUserId = () => this.auth.currentUser?.id;
  getInitials(name: string) { return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A'; }
  formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }

  async ngOnInit() {
    const data = await this.committeeService.getCommittees();
    this.committees.set(data);
    this.applyFilters();
    this.loading.set(false);
  }

  setStatus(s: string) { this.activeStatus.set(s); this.applyFilters(); }

  applyFilters() {
    let list = this.committees();
    if (this.activeStatus() !== 'all') list = list.filter(c => c.status === this.activeStatus());
    if (this.searchQuery) list = list.filter(c => c.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || c.description?.toLowerCase().includes(this.searchQuery.toLowerCase()));
    if (this.sortBy === 'amount_asc') list = [...list].sort((a, b) => a.monthly_amount - b.monthly_amount);
    else if (this.sortBy === 'amount_desc') list = [...list].sort((a, b) => b.monthly_amount - a.monthly_amount);
    else if (this.sortBy === 'members') list = [...list].sort((a, b) => b.current_members - a.current_members);
    this.filtered.set(list);
  }

  async joinCommittee(c: Committee) {
    const { error } = await this.committeeService.requestJoin(c.id);
    if (error) { this.toast.error(error); return; }
    this.toast.success('Join request sent! Waiting for admin approval.');
  }
}
