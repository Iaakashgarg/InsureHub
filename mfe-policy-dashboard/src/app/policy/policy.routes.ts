import { Routes } from '@angular/router';

export const POLICY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/policy-list/policy-list').then((m) => m.PolicyList),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../components/policy-detail/policy-detail').then((m) => m.PolicyDetail),
  },
];
