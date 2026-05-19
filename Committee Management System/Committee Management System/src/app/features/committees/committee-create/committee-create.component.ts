import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CommitteeService } from '../../../core/services/committee.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-committee-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="animate-fade-in" style="max-width:720px; margin:0 auto;">
      <div style="margin-bottom:24px;">
        <a routerLink="/committees" style="color:#94a3b8; font-size:13px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">← Back to Committees</a>
        <h2 style="font-size:20px; font-weight:700; margin-top:8px;">Create New Committee</h2>
        <p style="color:#94a3b8; font-size:14px;">Fill in the details to set up your digital committee</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <!-- Step indicators -->
        <div class="step-indicators">
          @for (step of steps; track step.n) {
            <div class="step-item" [class.active]="currentStep() >= step.n" [class.current]="currentStep() === step.n">
              <div class="step-circle">{{ step.n }}</div>
              <span style="font-size:12px;">{{ step.label }}</span>
            </div>
          }
        </div>

        <!-- Step 1: Basic Info -->
        @if (currentStep() === 1) {
          <div class="form-section glass-card animate-slide-up">
            <h3 class="section-title">📋 Basic Information</h3>
            <div class="form-group">
              <label class="form-label">Committee Name *</label>
              <input class="form-input" formControlName="name" placeholder="e.g. Monthly Savings Circle 2025" id="create-name">
              @if (form.get('name')?.invalid && form.get('name')?.touched) { <span class="form-error">Name is required</span> }
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-input" formControlName="description" rows="3" placeholder="Describe the purpose of this committee..." id="create-desc" style="resize:vertical;"></textarea>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
              <div class="form-group">
                <label class="form-label">Monthly Contribution (PKR) *</label>
                <input class="form-input" type="number" formControlName="monthly_amount" placeholder="10000" id="create-amount">
                @if (form.get('monthly_amount')?.invalid && form.get('monthly_amount')?.touched) { <span class="form-error">Amount is required</span> }
              </div>
              <div class="form-group">
                <label class="form-label">Duration (Months) *</label>
                <select class="form-input" formControlName="duration_months" id="create-duration">
                  @for (m of [3,6,9,10,12,18,24]; track m) { <option [value]="m">{{ m }} months</option> }
                </select>
              </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
              <div class="form-group">
                <label class="form-label">Max Members *</label>
                <input class="form-input" type="number" formControlName="max_members" placeholder="10" id="create-members">
              </div>
              <div class="form-group">
                <label class="form-label">Start Date *</label>
                <input class="form-input" type="date" formControlName="start_date" [min]="today" id="create-start">
              </div>
            </div>
          </div>
        }

        <!-- Step 2: Payment Info -->
        @if (currentStep() === 2) {
          <div class="form-section glass-card animate-slide-up">
            <h3 class="section-title">💳 Payment & Rules</h3>
            <div class="form-group">
              <label class="form-label">IBAN / Bank Account / Wallet ID *</label>
              <input class="form-input" formControlName="iban" placeholder="PK36SCBL0000001123456702" id="create-iban">
              @if (form.get('iban')?.invalid && form.get('iban')?.touched) { <span class="form-error">IBAN is required</span> }
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
              <div class="form-group">
                <label class="form-label">Preferred Payment Method</label>
                <select class="form-input" formControlName="payment_method" id="create-method">
                  <option value="stripe">Stripe (Online Card)</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Payment Deadline (Day of Month)</label>
                <select class="form-input" formControlName="payment_deadline" id="create-deadline">
                  @for (d of [1,5,10,15,20,25]; track d) { <option [value]="d">{{ d }}{{ d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th' }} of month</option> }
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Committee Rules</label>
              <textarea class="form-input" formControlName="rules" rows="4" placeholder="e.g. All members must pay by the 5th of each month. Late payments incur a 5% penalty..." id="create-rules" style="resize:vertical;"></textarea>
            </div>
          </div>
        }

        <!-- Summary -->
        @if (currentStep() === 2 && form.value.monthly_amount) {
          <div class="summary-card glass-card" style="margin-top:16px; padding:20px; background:rgba(99,102,241,0.08); border-color:rgba(99,102,241,0.3);">
            <h4 style="font-size:14px; font-weight:600; margin-bottom:12px;">📊 Committee Summary</h4>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; text-align:center;">
              <div>
                <p style="color:#94a3b8; font-size:12px;">Monthly Pool</p>
                <p style="font-weight:700; font-size:16px; color:#818cf8;">PKR {{ ((form.value.monthly_amount || 0) * (form.value.max_members || 0)).toLocaleString() }}</p>
              </div>
              <div>
                <p style="color:#94a3b8; font-size:12px;">Total Committee Value</p>
                <p style="font-weight:700; font-size:16px; color:#34d399;">PKR {{ ((form.value.monthly_amount || 0) * (form.value.max_members || 0) * (form.value.duration_months || 0)).toLocaleString() }}</p>
              </div>
              <div>
                <p style="color:#94a3b8; font-size:12px;">Your Total Contribution</p>
                <p style="font-weight:700; font-size:16px; color:#fbbf24;">PKR {{ ((form.value.monthly_amount || 0) * (form.value.duration_months || 0)).toLocaleString() }}</p>
              </div>
            </div>
          </div>
        }

        @if (error()) { <div class="error-banner" style="margin-top:16px;">❌ {{ error() }}</div> }

        <!-- Navigation -->
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          @if (currentStep() > 1) {
            <button type="button" class="btn-secondary" (click)="currentStep.set(currentStep() - 1)" id="create-back">← Back</button>
          } @else { <div></div> }
          @if (currentStep() < 2) {
            <button type="button" class="btn-primary" (click)="nextStep()" id="create-next">Next →</button>
          } @else {
            <button type="submit" class="btn-primary" [disabled]="loading()" id="create-submit">
              @if (loading()) { <div class="spinner" style="width:18px;height:18px;border-width:2px;"></div> Creating... }
              @else { 🚀 Create Committee }
            </button>
          }
        </div>
      </form>
    </div>
  `,
  styles: [`
    .step-indicators { display:flex; align-items:center; gap:0; margin-bottom:24px; }
    .step-item { display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; position:relative; }
    .step-item:not(:last-child)::after { content:''; position:absolute; top:16px; left:calc(50% + 16px); right:calc(-50% + 16px); height:2px; background:rgba(99,102,241,0.2); }
    .step-item.active:not(:last-child)::after { background:#6366f1; }
    .step-circle { width:32px; height:32px; border-radius:50%; background:rgba(99,102,241,0.1); border:2px solid rgba(99,102,241,0.3); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#94a3b8; transition:all 0.3s; }
    .step-item.active .step-circle { background:rgba(99,102,241,0.2); border-color:#6366f1; color:#818cf8; }
    .step-item.current .step-circle { background:#6366f1; color:white; }
    .form-section { padding:28px; margin-bottom:0; }
    .section-title { font-size:16px; font-weight:700; margin-bottom:20px; }
    .error-banner { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#f87171; padding:12px 16px; border-radius:10px; font-size:13px; }
  `]
})
export class CommitteeCreateComponent {
  fb = inject(FormBuilder);
  committeeService = inject(CommitteeService);
  router = inject(Router);
  toast = inject(ToastService);
  loading = signal(false);
  error = signal('');
  currentStep = signal(1);
  today = new Date().toISOString().split('T')[0];

  steps = [{ n: 1, label: 'Basic Info' }, { n: 2, label: 'Payment & Rules' }];

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    monthly_amount: [null as number | null, [Validators.required, Validators.min(100)]],
    duration_months: [10, Validators.required],
    max_members: [null as number | null, [Validators.required, Validators.min(2)]],
    start_date: ['', Validators.required],
    iban: ['', Validators.required],
    payment_method: ['stripe'],
    payment_deadline: [5],
    rules: [''],
  });

  nextStep() {
    const step1Fields = ['name', 'monthly_amount', 'duration_months', 'max_members', 'start_date'];
    step1Fields.forEach(f => this.form.get(f)?.markAsTouched());
    if (step1Fields.some(f => this.form.get(f)?.invalid)) return;
    this.currentStep.set(2);
  }

  async onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true); this.error.set('');
    const { data, error } = await this.committeeService.createCommittee(this.form.value as any);
    if (error) { this.error.set(error); this.loading.set(false); return; }
    this.toast.success('Committee created successfully! 🎉');
    this.router.navigate(['/committees', data?.id]);
  }
}
