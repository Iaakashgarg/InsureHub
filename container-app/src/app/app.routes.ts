import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { Home } from './components/home/home';

export const routes: Routes = [
  { path: '', component: Home },
  {
    path: 'policies',
    loadChildren: () =>
      loadRemoteModule({
        type: 'module',
        remoteEntry: 'http://localhost:4201/remoteEntry.js',
        exposedModule: './routes',
      }).then((m) => m.POLICY_ROUTES),
  },
  {
    path: 'payments',
    loadChildren: () =>
      loadRemoteModule({
        type: 'module',
        remoteEntry: 'http://localhost:4202/remoteEntry.js',
        exposedModule: './routes',
      }).then((m) => m.PAYMENT_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
