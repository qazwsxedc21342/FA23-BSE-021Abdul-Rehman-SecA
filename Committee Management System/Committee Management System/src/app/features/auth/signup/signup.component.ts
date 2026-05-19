import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-bg">
        <div class="auth-orb orb-1"></div>
        <div class="auth-orb orb-2"></div>
      </div>
      <div class="auth-container animate-slide-up" style="max-width:480px;">
        <div class="auth-logo">
          <div class="logo-icon">💎</div>
          <h1 class="gradient-text" style="font-size:28px; font-weight:800;">CommitteeHub</h1>
          <p style="color:#94a3b8; margin-top:4px; font-size:14px;">Create your account</p>
        </div>
        <div class="auth-card glass-card">
          <h2 style="font-size:20px; font-weight:700; margin-bottom:20px;">Join CommitteeHub</h2>
          @if (success()) {
            <div style="text-align:center; padding:20px;">
              <div style="font-size:48px; margin-bottom:16px;">📧</div>
              <h3 style="font-size:18px; font-weight:700; margin-bottom:8px;">Check your email!</h3>
              <p style="color:#94a3b8; font-size:14px;">We sent a confirmation link to <strong style="color:#f1f5f9;">{{ form.value.email }}</strong></p>
              <a routerLink="/auth/login" class="btn-primary" style="display:inline-flex; margin-top:20px;">Go to Login</a>
            </div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <div class="form-group">
                  <label class="form-label">Full Name</label>
                  <input class="form-input" type="text" formControlName="fullName" placeholder="John Doe" id="signup-name">
                  @if (form.get('fullName')?.invalid && form.get('fullName')?.touched) {
                    <span class="form-error">Full name required</span>
                  }
                </div>
                <div class="form-group">
                  <label class="form-label">Phone Number</label>
                  <input class="form-input" type="tel" formControlName="phone" placeholder="+92 300 0000000" id="signup-phone">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input class="form-input" type="email" formControlName="email" placeholder="you@example.com" id="signup-email">
                @if (form.get('email')?.invalid && form.get('email')?.touched) {
                  <span class="form-error">Valid email required</span>
                }
              </div>
              <div class="form-group">
                <label class="form-label">CNIC (Optional)</label>
                <input class="form-input" type="text" formControlName="cnic" placeholder="XXXXX-XXXXXXX-X" id="signup-cnic">
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input class="form-input" type="password" formControlName="password" placeholder="Min. 8 characters" id="signup-password">
                @if (form.get('password')?.invalid && form.get('password')?.touched) {
                  <span class="form-error">Password must be at least 8 characters</span>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Confirm Password</label>
                <input class="form-input" type="password" formControlName="confirmPassword" placeholder="Repeat password" id="signup-confirm">
                @if (form.hasError('mismatch') && form.get('confirmPassword')?.touched) {
                  <span class="form-error">Passwords do not match</span>
                }
              </div>
              @if (error()) {
                <div class="error-banner">❌ {{ error() }}</div>
              }
              <button type="submit" class="btn-primary" style="width:100%; justify-content:center;" [disabled]="loading() || form.invalid" id="signup-submit">
                @if (loading()) { <div class="spinner" style="width:18px;height:18px;border-width:2px;"></div> Creating account... }
                @else { Create Account }
              </button>
            </form>
            <div style="text-align:center; margin-top:20px;">
              <p style="color:#94a3b8; font-size:13px;">
                Already have an account?
                <a routerLink="/auth/login" style="color:#6366f1; font-weight:600; text-decoration:none; margin-left:4px;">Sign in</a>
              </p>
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
    .auth-orb.orb-1 { width:400px; height:400px; background:radial-gradient(#6366f1,transparent); top:-100px; right:-100px; }
    .auth-orb.orb-2 { width:300px; height:300px; background:radial-gradient(#10b981,transparent); bottom:-50px; left:-50px; }
    .auth-container { width:100%; position:relative; z-index:1; }
    .auth-logo { text-align:center; margin-bottom:24px; }
    .logo-icon { font-size:40px; margin-bottom:8px; }
    .auth-card { padding:32px; }
    .error-banner { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#f87171; padding:12px 16px; border-radius:10px; font-size:13px; margin-bottom:16px; }
  `]
})
export class SignupComponent {
  fb = inject(FormBuilder);
  auth = inject(AuthService);
  router = inject(Router);
  toast = inject(ToastService);
  loading = signal(false);
  error = signal('');
  success = signal(false);

  form = this.fb.group({
    fullName: ['', Validators.required],
    phone: [''],
    email: ['', [Validators.required, Validators.email]],
    cnic: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(form: any) {
    return form.get('password')?.value === form.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  async onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true); this.error.set('');
    const { email, password, fullName, phone } = this.form.value;
    const { error } = await this.auth.signUp(email!, password!, fullName!, phone || '');
    if (error) { this.error.set(error); this.loading.set(false); return; }
    this.success.set(true);
    this.toast.success('Account created! Check your email to verify.');
  }
}
