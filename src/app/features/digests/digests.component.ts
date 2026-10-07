import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { AdminApiService } from '../../core/api/admin-api.service';
import { AdminDigest } from '../../core/api/admin-digest.models';
import { AdminUserListItem } from '../../core/api/admin-user.models';
import { apiError } from '../../core/api/api-error';
import { ToastService } from '../../core/toast.service';
import { TableRowLinkDirective } from '../../shared/directives/table-row-link.directive';

const filterKeys = [
  'status',
  'type',
  'email',
  'deliveryMode',
  'createdFrom',
  'createdTo',
  'sentFrom',
  'sentTo',
  'updatedFrom',
  'updatedTo',
];

@Component({
  selector: 'app-digests',
  imports: [DatePipe, FormsModule, RouterLink, TableRowLinkDirective],
  templateUrl: './digests.component.html',
  styleUrl: './digests.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigestsComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toasts = inject(ToastService);
  readonly digests = signal<AdminDigest[]>([]);
  readonly users = signal<AdminUserListItem[]>([]);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal('');
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);
  filters: Record<string, string> = {};
  userSearch = '';
  previewUserId = '';
  previewType: 'daily' | 'weekly' = 'daily';

  constructor() {
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          this.page.set(Math.max(1, Number(params.get('page')) || 1));
          this.filters = Object.fromEntries(filterKeys.map((key) => [key, params.get(key) ?? '']));
          this.loading.set(true);
          this.error.set('');
          return this.api.digests(this.query(params)).pipe(
            catchError((error: unknown) => {
              this.loading.set(false);
              this.error.set(apiError(error, 'Digests could not be loaded.'));
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.digests.set(result.data);
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

  findUser() {
    if (!this.userSearch.trim() || this.pending()) return;
    this.pending.set(true);
    this.error.set('');
    this.api
      .users({ email: this.userSearch.trim(), page: 1, limit: 20 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.users.set(result.data);
          this.previewUserId = result.data.length === 1 ? result.data[0].id : '';
          this.pending.set(false);
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.error.set(apiError(error, 'User lookup failed.'));
        },
      });
  }

  createPreview() {
    if (!this.previewUserId || this.pending()) return;
    this.pending.set(true);
    this.error.set('');
    this.api
      .triggerDigest({ userId: this.previewUserId, type: this.previewType })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (digest) => {
          this.pending.set(false);
          this.toasts.success(
            'Administrator preview created and queued for delivery to your administrator address.',
          );
          void this.router.navigate(['/digests', digest.id]);
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.error.set(apiError(error, 'Preview could not be created.'));
        },
      });
  }
}
