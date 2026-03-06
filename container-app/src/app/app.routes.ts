import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { Home } from './components/home/home';

// These are replaced at build time by webpack DefinePlugin
declare const process: {
  env: { MFE_POLICY_DASHBOARD_URL: string; MFE_PREMIUM_PAYMENT_URL: string };
};

const POLICY_DASHBOARD_URL = process.env.MFE_POLICY_DASHBOARD_URL;
const PREMIUM_PAYMENT_URL = process.env.MFE_PREMIUM_PAYMENT_URL;

export const routes: Routes = [
  { path: '', component: Home },
  {
    path: 'policies',
    loadChildren: () =>
      loadRemoteModule({
        type: 'module',
        remoteEntry: `${POLICY_DASHBOARD_URL}/remoteEntry.js`,
        exposedModule: './routes',
      }).then((m) => m.POLICY_ROUTES),
  },
  {
    path: 'payments',
    loadChildren: () =>
      loadRemoteModule({
        type: 'module',
        remoteEntry: `${PREMIUM_PAYMENT_URL}/remoteEntry.js`,
        exposedModule: './routes',
      }).then((m) => m.PAYMENT_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
