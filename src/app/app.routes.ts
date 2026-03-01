import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/callback/callback.component').then((m) => m.CallbackComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'lists',
        pathMatch: 'full',
      },
      {
        path: 'lists',
        loadComponent: () =>
          import('./features/lists/list-overview/list-overview.component').then(
            (m) => m.ListOverviewComponent,
          ),
      },
      {
        path: 'lists/:id',
        loadComponent: () =>
          import('./features/lists/list-detail/list-detail.component').then(
            (m) => m.ListDetailComponent,
          ),
      },
      {
        path: 'lists/:id/add-item',
        loadComponent: () =>
          import('./features/items/item-form/item-form.component').then(
            (m) => m.ItemFormComponent,
          ),
      },
      {
        path: 'family',
        loadComponent: () =>
          import('./features/family/dashboard/family-dashboard.component').then(
            (m) => m.FamilyDashboardComponent,
          ),
      },
      {
        path: 'budget',
        loadComponent: () =>
          import('./features/budget/budget-overview/budget-overview.component').then(
            (m) => m.BudgetOverviewComponent,
          ),
      },
      {
        path: 'budget/create',
        loadComponent: () =>
          import('./features/budget/budget-form/budget-form.component').then(
            (m) => m.BudgetFormComponent,
          ),
      },
      {
        path: 'budget/add-expense',
        loadComponent: () =>
          import('./features/budget/expense-form/expense-form.component').then(
            (m) => m.ExpenseFormComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
