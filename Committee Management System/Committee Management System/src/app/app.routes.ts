import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'signup', loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ]
  },
  {
    path: '',
    loadComponent: () => import('./shared/layout/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'committees', loadComponent: () => import('./features/committees/committee-list/committee-list.component').then(m => m.CommitteeListComponent) },
      { path: 'committees/create', loadComponent: () => import('./features/committees/committee-create/committee-create.component').then(m => m.CommitteeCreateComponent) },
      { path: 'committees/:id', loadComponent: () => import('./features/committees/committee-detail/committee-detail.component').then(m => m.CommitteeDetailComponent) },
      { path: 'committees/:id/manage', loadComponent: () => import('./features/committees/committee-manage/committee-manage.component').then(m => m.CommitteeManageComponent) },
      { path: 'payments/:committeeId', loadComponent: () => import('./features/payments/pay-installment/pay-installment.component').then(m => m.PayInstallmentComponent) },
      { path: 'payment-history', loadComponent: () => import('./features/payments/payment-history/payment-history.component').then(m => m.PaymentHistoryComponent) },
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent) },
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
