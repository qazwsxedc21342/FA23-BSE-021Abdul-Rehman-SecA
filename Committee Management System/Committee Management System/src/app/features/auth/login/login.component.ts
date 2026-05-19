import { Component, OnInit, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-bg">
        <div class="auth-orb orb-1"></div>
        <div class="auth-orb orb-2"></div>
      </div>
      <div class="auth-container animate-slide-up">
        <div class="auth-logo">
          <div class="logo-icon">💎</div>
          <h1 class="gradient-text" style="font-size:28px; font-weight:800;">CommitteeHub</h1>
          <p style="color:#94a3b8; margin-top:4px; font-size:14px;">Digital ROSCA Platform</p>
        </div>
        <div class="auth-card glass-card">
          <h2 style="font-size:20px; font-weight:700; margin-bottom:8px;">Welcome back</h2>
          <p style="color:#94a3b8; font-size:13px; margin-bottom:28px;">Sign in to your account</p>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input class="form-input" type="email" formControlName="email" placeholder="you@example.com" id="login-email">
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <span class="form-error">Valid email is required</span>
              }
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <div style="position:relative;">
                <input class="form-input" [type]="showPassword() ? 'text' : 'password'" formControlName="password" placeholder="••••••••" id="login-password" style="padding-right:44px;">
                <button type="button" (click)="showPassword.set(!showPassword())" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#94a3b8;cursor:pointer;">
                  {{ showPassword() ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <span class="form-error">Password is required</span>
              }
            </div>
            <div style="display:flex; justify-content:flex-end; margin-top:-12px; margin-bottom:20px;">
              <a routerLink="/auth/forgot-password" style="color:#6366f1; font-size:13px; text-decoration:none;">Forgot password?</a>
            </div>
            @if (error()) {
              <div class="error-banner">❌ {{ error() }}</div>
            }
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center;" [disabled]="loading() || form.invalid" id="login-submit">
              @if (loading()) { <div class="spinner" style="width:18px;height:18px;border-width:2px;"></div> Signing in... }
              @else { Sign In }
            </button>
          </form>
          <div style="text-align:center; margin-top:20px;">
            <p style="color:#94a3b8; font-size:13px;">
              Don't have an account?
              <a routerLink="/auth/signup" style="color:#6366f1; font-weight:600; text-decoration:none; margin-left:4px;">Create account</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; padding:20px; }
    .auth-bg { position:fixed; inset:0; pointer-events:none; }
    .auth-orb { position:absolute; border-radius:50%; filter:blur(80px); opacity:0.3; }
    .auth-orb.orb-1 { width:400px; height:400px; background:radial-gradient(#6366f1,transparent); top:-100px; left:-100px; }
    .auth-orb.orb-2 { width:300px; height:300px; background:radial-gradient(#10b981,transparent); bottom:-50px; right:-50px; }
    .auth-container { width:100%; max-width:420px; position:relative; z-index:1; }
    .auth-logo { text-align:center; margin-bottom:28px; }
    .logo-icon { font-size:48px; margin-bottom:8px; }
    .auth-card { padding:36px; }
    .error-banner { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#f87171; padding:12px 16px; border-radius:10px; font-size:13px; margin-bottom:16px; }
  `]
})
export class LoginComponent {
  fb = inject(FormBuilder);
  auth = inject(AuthService);
  router = inject(Router);
  toast = inject(ToastService);
  loading = signal(false);
  error = signal('');
  showPassword = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  async onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true); this.error.set('');
    const { email, password } = this.form.value;
    const { error } = await this.auth.signIn(email!, password!);
    if (error) { this.error.set(error); this.loading.set(false); return; }
    this.toast.success('Welcome back! 🎉');
    this.router.navigate(['/dashboard']);
  }
}
