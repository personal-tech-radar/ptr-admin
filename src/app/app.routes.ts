import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
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
      {
        path: 'users/:id',
        title: 'User detail',
        loadComponent: () =>
          import('./features/users/user-detail.component').then((m) => m.UserDetailComponent),
      },
      {
        path: 'users',
        title: 'Users',
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'digests/:id',
        title: 'Digest detail',
        loadComponent: () =>
          import('./features/digests/digest-detail.component').then((m) => m.DigestDetailComponent),
      },
      {
        path: 'digests',
        title: 'Digests',
        loadComponent: () =>
          import('./features/digests/digests.component').then((m) => m.DigestsComponent),
      },
      {
        path: 'jobs/:queue/:id',
        title: 'Job detail',
        loadComponent: () =>
          import('./features/jobs/job-detail.component').then((m) => m.JobDetailComponent),
      },
      {
        path: 'jobs',
        title: 'Queues',
        loadComponent: () => import('./features/jobs/jobs.component').then((m) => m.JobsComponent),
      },
      {
        path: 'articles/:id',
        title: 'Article detail',
        loadComponent: () =>
          import('./features/articles/article-detail.component').then(
            (m) => m.ArticleDetailComponent,
          ),
      },
      {
        path: 'articles',
        title: 'Articles',
        loadComponent: () =>
          import('./features/articles/articles.component').then((m) => m.ArticlesComponent),
      },
      {
        path: 'taxonomy/:id',
        title: 'Taxonomy detail',
        loadComponent: () =>
          import('./features/taxonomy/taxonomy-detail.component').then(
            (m) => m.TaxonomyDetailComponent,
          ),
      },
      {
        path: 'taxonomy',
        title: 'Taxonomy',
        loadComponent: () =>
          import('./features/taxonomy/taxonomy.component').then((m) => m.TaxonomyComponent),
      },
      {
        path: 'coverage',
        pathMatch: 'full',
        redirectTo: () => inject(Router).createUrlTree(['/taxonomy']),
      },
      {
        path: 'sources/candidates/:id',
        title: 'Candidate detail',
        loadComponent: () =>
          import('./features/sources/candidate-detail.component').then(
            (m) => m.CandidateDetailComponent,
          ),
      },
      {
        path: 'sources/:id',
        title: 'Source detail',
        loadComponent: () =>
          import('./features/sources/source-detail.component').then((m) => m.SourceDetailComponent),
      },
      {
        path: 'sources',
        title: 'Sources',
        loadComponent: () =>
          import('./features/sources/sources.component').then((m) => m.SourcesComponent),
      },
      {
        path: 'info-pages/new',
        title: 'New information page',
        loadComponent: () =>
          import('./features/info-pages/info-page-editor.component').then(
            (m) => m.InfoPageEditorComponent,
          ),
      },
      {
        path: 'info-pages/:id',
        title: 'Edit information page',
        loadComponent: () =>
          import('./features/info-pages/info-page-editor.component').then(
            (m) => m.InfoPageEditorComponent,
          ),
      },
      {
        path: 'info-pages',
        title: 'Information pages',
        loadComponent: () =>
          import('./features/info-pages/info-pages.component').then((m) => m.InfoPagesComponent),
      },
      {
        path: 'admins',
        title: 'Administrators',
        loadComponent: () =>
          import('./features/administrators/administrators.component').then(
            (m) => m.AdministratorsComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
