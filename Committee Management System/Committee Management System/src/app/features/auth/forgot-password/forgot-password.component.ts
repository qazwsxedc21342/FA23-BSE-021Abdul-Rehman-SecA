import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-bg"><div class="auth-orb orb-1"></div><div class="auth-orb orb-2"></div></div>
      <div class="auth-container animate-slide-up">
        <div class="auth-logo">
          <div class="logo-icon">💎</div>
          <h1 class="gradient-text" style="font-size:28px; font-weight:800;">CommitteeHub</h1>
        </div>
        <div class="auth-card glass-card">
          @if (sent()) {
            <div style="text-align:center; padding:10px 0;">
              <div style="font-size:48px; margin-bottom:16px;">📬</div>
              <h2 style="font-size:20px; font-weight:700; margin-bottom:8px;">Email Sent!</h2>
              <p style="color:#94a3b8; font-size:14px; margin-bottom:24px;">Check your inbox for a password reset link.</p>
              <a routerLink="/auth/login" class="btn-secondary" style="display:inline-flex;">Back to Login</a>
            </div>
          } @else {
            <h2 style="font-size:20px; font-weight:700; margin-bottom:8px;">Reset Password</h2>
            <p style="color:#94a3b8; font-size:13px; margin-bottom:24px;">Enter your email to receive a reset link.</p>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input class="form-input" type="email" formControlName="email" placeholder="you@example.com" id="reset-email">
              </div>
              @if (error()) { <div class="error-banner">❌ {{ error() }}</div> }
              <button type="submit" class="btn-primary" style="width:100%; justify-content:center;" [disabled]="loading()" id="reset-submit">
                @if (loading()) { Sending... } @else { Send Reset Link }
              </button>
            </form>
            <div style="text-align:center; margin-top:20px;">
              <a routerLink="/auth/login" style="color:#6366f1; font-size:13px; text-decoration:none;">← Back to Login</a>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; padding:20px; }
    .auth-bg { position:fixed; inset:0; pointer-events:none; }
    .auth-orb { position:absolute; border-radius:50%; filter:blur(80px); opacity:0.3; }
    .auth-orb.orb-1 { width:350px; height:350px; background:radial-gradient(#6366f1,transparent); top:-80px; left:-80px; }
    .auth-orb.orb-2 { width:250px; height:250px; background:radial-gradient(#f59e0b,transparent); bottom:-40px; right:-40px; }
    .auth-container { width:100%; max-width:420px; position:relative; z-index:1; }
    .auth-logo { text-align:center; margin-bottom:24px; }
    .logo-icon { font-size:40px; margin-bottom:8px; }
    .auth-card { padding:36px; }
    .error-banner { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#f87171; padding:12px 16px; border-radius:10px; font-size:13px; margin-bottom:16px; }
  `]
})
export class ForgotPasswordComponent {
  fb = inject(FormBuilder);
  auth = inject(AuthService);
  loading = signal(false);
  error = signal('');
  sent = signal(false);

  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });

  async onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true); this.error.set('');
    const { error } = await this.auth.resetPassword(this.form.value.email!);
    if (error) { this.error.set(error); } else { this.sent.set(true); }
    this.loading.set(false);
  }
}
