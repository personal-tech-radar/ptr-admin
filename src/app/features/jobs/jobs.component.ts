import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { AdminApiService } from '../../core/api/admin-api.service';
import { AdminJob, QueueSummary, jobReferencePath } from '../../core/api/admin-job.models';
import { apiError } from '../../core/api/api-error';
import { TableRowLinkDirective } from '../../shared/directives/table-row-link.directive';

@Component({
  selector: 'app-jobs',
  imports: [DatePipe, FormsModule, RouterLink, TableRowLinkDirective],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobsComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly summary = signal<QueueSummary[]>([]);
  readonly jobs = signal<AdminJob[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly summaryError = signal('');
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);
  filters: Record<string, string> = {};
  readonly referencePath = jobReferencePath;

  constructor() {
    this.api
      .queueSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: (error: unknown) =>
          this.summaryError.set(apiError(error, 'Queue summary could not be loaded.')),
      });
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          this.page.set(Math.max(1, Number(params.get('page')) || 1));
          this.filters = { queue: params.get('queue') ?? '', state: params.get('state') ?? '' };
          this.loading.set(true);
          this.error.set('');
          return this.api.jobs({ page: this.page(), limit: 20, ...this.filters }).pipe(
            catchError((error: unknown) => {
              this.loading.set(false);
              this.error.set(apiError(error, 'Jobs could not be loaded.'));
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.jobs.set(result.data);
        this.total.set(result.meta.total);
        this.totalPages.set(Math.max(1, result.meta.totalPages));
        this.loading.set(false);
      });
  }

  applyFilters() {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...this.filters, page: 1 },
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
}
