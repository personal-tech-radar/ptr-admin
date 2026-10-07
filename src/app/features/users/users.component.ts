import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { AdminApiService } from '../../core/api/admin-api.service';
import { apiError } from '../../core/api/api-error';
import { AdminUserListItem, UserPage } from '../../core/api/admin-user.models';

const filterKeys = [
  'email',
  'registeredFrom',
  'registeredTo',
  'verified',
  'verifiedFrom',
  'verifiedTo',
  'onboardingCompleted',
  'onboardingFrom',
  'onboardingTo',
  'activityPeriod',
  'activityFrom',
  'activityTo',
  'eventType',
];

@Component({
  selector: 'app-users',
  imports: [DatePipe, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly users = signal<AdminUserListItem[]>([]);
  readonly activityWindow = signal<UserPage['activityWindow'] | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);
  filters: Record<string, string> = {};

  constructor() {
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          this.page.set(Math.max(1, Number(params.get('page')) || 1));
          this.filters = Object.fromEntries(filterKeys.map((key) => [key, params.get(key) ?? '']));
          this.loading.set(true);
          this.error.set('');
          return this.api.users(this.query(params)).pipe(
            catchError((error: unknown) => {
              this.loading.set(false);
              this.error.set(apiError(error, 'User data could not be loaded.'));
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.users.set(result.data);
        this.activityWindow.set(result.activityWindow);
        this.total.set(result.meta.total);
        this.totalPages.set(Math.max(1, result.meta.totalPages));
        this.loading.set(false);
      });
  }

  private query(params: ParamMap): Record<string, unknown> {
    const query: Record<string, unknown> = { page: this.page(), limit: 20 };
    for (const key of filterKeys) {
      const value = params.get(key);
      if (value) query[key] = value;
    }
    return query;
  }

  applyFilters() {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        ...Object.fromEntries(Object.entries(this.filters).filter(([, value]) => value)),
        page: 1,
      },
    });
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }

  openUser(id: string) {
    void this.router.navigate(['/users', id]);
  }

  taxonomySelectionLabels(user: AdminUserListItem): string {
    return (
      [
        ...user.selectedTechnologies.map((item) => item.name),
        ...user.selectedInterests.map((item) => item.name),
      ].join(', ') || '—'
    );
  }

  streamSelectionLabels(user: AdminUserListItem): string {
    return user.selectedStreams.map((item) => item.name).join(', ') || '—';
  }
}
