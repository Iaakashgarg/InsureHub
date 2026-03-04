import { Routes } from '@angular/router';

export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../components/payment-form/payment-form').then((m) => m.PaymentForm),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('../components/payment-history/payment-history').then((m) => m.PaymentHistory),
  },
];
