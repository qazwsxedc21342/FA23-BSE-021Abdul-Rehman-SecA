import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastService } from './core/services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <router-outlet></router-outlet>
    <!-- Toast Container -->
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast-{{toast.type}}" (click)="toastService.dismiss(toast.id)">
          <span class="toast-icon">
            @if (toast.type === 'success') { ✅ }
            @else if (toast.type === 'error') { ❌ }
            @else if (toast.type === 'warning') { ⚠️ }
            @else { ℹ️ }
          </span>
          <span style="flex:1; font-size:13px;">{{ toast.message }}</span>
          <span style="cursor:pointer; color: #94a3b8; font-size:16px;">×</span>
        </div>
      }
    </div>
  `,
})
export class AppComponent {
  toastService = inject(ToastService);
}
