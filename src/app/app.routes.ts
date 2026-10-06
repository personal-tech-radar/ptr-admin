import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Admin login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      ...['articles', 'sources', 'taxonomy', 'coverage', 'users', 'digests', 'jobs', 'admins'].map(
        (path) => ({
          path,
          title: path[0].toUpperCase() + path.slice(1),
          loadComponent: () =>
            import('./features/admin-page/admin-page.component').then((m) => m.AdminPageComponent),
          data: { resource: path },
        }),
      ),
    ],
  },
  { path: '**', redirectTo: '' },
];
