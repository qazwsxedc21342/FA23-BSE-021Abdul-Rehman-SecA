import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { SupabaseService } from '../../core/services/supabase.service';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  cnic?: string;
  avatar_url?: string;
  reputation_score: number;
  completed_committees_count: number;
  created_at: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="animate-fade-in" style="max-width:700px;">
      <!-- Profile Header -->
      <div class="glass-card" style="padding:32px;margin-bottom:24px;display:flex;align-items:center;gap:24px;flex-wrap:wrap;">
        <div class="profile-avatar" (click)="fileInput.click()" title="Click to change avatar">
          @if (profile()?.avatar_url) {
            <img [src]="profile()!.avatar_url!" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="avatar">
          } @else {
            <span>{{ getInitials(profile()?.full_name || 'U') }}</span>
          }
          <div class="avatar-overlay">📷</div>
        </div>
        <input #fileInput type="file" accept="image/*" style="display:none" (change)="uploadAvatar($event)" id="avatar-upload">
        <div>
          <h2 style="font-size:22px;font-weight:800;">{{ profile()?.full_name }}</h2>
          <p style="color:#94a3b8;font-size:14px;">{{ profile()?.email }}</p>
          <div style="display:flex;gap:12px;margin-top:12px;flex-wrap:wrap;">
            <div class="rep-badge">
              <span style="font-size:20px;">⭐</span>
              <div>
                <p style="font-size:18px;font-weight:800;color:#fbbf24;">{{ profile()?.reputation_score ?? 100 }}</p>
                <p style="color:#94a3b8;font-size:11px;">Reputation</p>
              </div>
            </div>
            <div class="rep-badge">
              <span style="font-size:20px;">🏆</span>
              <div>
                <p style="font-size:18px;font-weight:800;color:#34d399;">{{ profile()?.completed_committees_count ?? 0 }}</p>
                <p style="color:#94a3b8;font-size:11px;">Completed</p>
              </div>
            </div>
            <div class="rep-badge" [style.background]="getRepColor()">
              <span style="font-size:14px;font-weight:700;color:#f1f5f9;">{{ getRepLabel() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Reputation Bar -->
      <div class="glass-card" style="padding:24px;margin-bottom:24px;">
        <h3 style="font-size:15px;font-weight:700;margin-bottom:16px;">📈 Reputation Score</h3>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
          <span style="font-size:13px;color:#94a3b8;">0</span>
          <div class="progress-bar" style="flex:1;height:10px;">
            <div class="progress-fill" [style.width.%]="repPercent()"></div>
          </div>
          <span style="font-size:13px;color:#94a3b8;">200+</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px;">
          <div style="text-align:center;padding:12px;background:rgba(16,185,129,0.08);border-radius:10px;border:1px solid rgba(16,185,129,0.2);">
            <p style="color:#34d399;font-size:12px;font-weight:600;">✅ On-time payment</p>
            <p style="color:#94a3b8;font-size:11px;">+5 per payment</p>
          </div>
          <div style="text-align:center;padding:12px;background:rgba(239,68,68,0.08);border-radius:10px;border:1px solid rgba(239,68,68,0.2);">
            <p style="color:#f87171;font-size:12px;font-weight:600;">❌ Missed payment</p>
            <p style="color:#94a3b8;font-size:11px;">-10 per miss</p>
          </div>
          <div style="text-align:center;padding:12px;background:rgba(99,102,241,0.08);border-radius:10px;border:1px solid rgba(99,102,241,0.2);">
            <p style="color:#818cf8;font-size:12px;font-weight:600;">🏆 Complete committee</p>
            <p style="color:#94a3b8;font-size:11px;">+25 bonus</p>
          </div>
        </div>
      </div>

      <!-- Edit Form -->
      <div class="glass-card" style="padding:24px;">
        <h3 style="font-size:15px;font-weight:700;margin-bottom:20px;">✏️ Edit Profile</h3>
        <form [formGroup]="form" (ngSubmit)="saveProfile()">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input class="form-input" formControlName="full_name" id="profile-name">
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input class="form-input" formControlName="phone" id="profile-phone">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">CNIC</label>
            <input class="form-input" formControlName="cnic" placeholder="XXXXX-XXXXXXX-X" id="profile-cnic">
          </div>
          @if (saveSuccess()) {
            <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:#34d399;padding:12px 16px;border-radius:10px;font-size:13px;margin-bottom:16px;">✅ Profile updated!</div>
          }
          <button type="submit" class="btn-primary" [disabled]="saving()" id="profile-save">
            @if (saving()) { Saving... } @else { Save Changes }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .profile-avatar { width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#10b981);display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:800;color:white;cursor:pointer;position:relative;flex-shrink:0;overflow:hidden; }
    .avatar-overlay { position:absolute;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:20px;opacity:0;transition:opacity 0.2s;border-radius:50%; }
    .profile-avatar:hover .avatar-overlay { opacity:1; }
    .rep-badge { display:flex;align-items:center;gap:8px;padding:8px 14px;background:rgba(15,23,42,0.6);border:1px solid rgba(99,102,241,0.2);border-radius:10px; }
  `]
})
export class ProfileComponent implements OnInit {
  private authService: AuthService = inject(AuthService);
  private toastService: ToastService = inject(ToastService);
  private supabaseService: SupabaseService = inject(SupabaseService);
  private fb: FormBuilder = inject(FormBuilder);

  saving = signal(false);
  saveSuccess = signal(false);
  profile = signal<UserProfile | null>(null);

  form = this.fb.group({
    full_name: ['', Validators.required],
    phone: [''],
    cnic: [''],
  });

  getInitials(name: string) { return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'; }

  repPercent() {
    return Math.min((this.profile()?.reputation_score ?? 100), 200) / 2;
  }

  getRepLabel() {
    const s = this.profile()?.reputation_score ?? 100;
    if (s >= 150) return '🌟 Excellent';
    if (s >= 100) return '✅ Good';
    if (s >= 50) return '⚠️ Fair';
    return '❌ Poor';
  }

  getRepColor() {
    const s = this.profile()?.reputation_score ?? 100;
    if (s >= 150) return 'rgba(16,185,129,0.1)';
    if (s >= 100) return 'rgba(99,102,241,0.1)';
    if (s >= 50) return 'rgba(245,158,11,0.1)';
    return 'rgba(239,68,68,0.1)';
  }

  ngOnInit() {
    this.authService.profile$.subscribe(p => {
      if (p) {
        this.profile.set(p as unknown as UserProfile);
        this.form.patchValue({ full_name: (p as any).full_name || '', phone: (p as any).phone || '', cnic: (p as any).cnic || '' });
      }
    });
  }

  async saveProfile() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const result = await this.authService.updateProfile(this.form.value as any);
    const error = (result as any)?.error;
    if (error) this.toastService.error(error as string);
    else { this.saveSuccess.set(true); setTimeout(() => this.saveSuccess.set(false), 3000); }
    this.saving.set(false);
  }

  async uploadAvatar(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    const user = this.authService.currentUser as any;
    if (!file || !user) return;
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;
    const supabase = this.supabaseService.client as any;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { this.toastService.error('Upload failed'); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    await this.authService.updateProfile({ avatar_url: data.publicUrl });
    this.toastService.success('Avatar updated!');
  }
}
