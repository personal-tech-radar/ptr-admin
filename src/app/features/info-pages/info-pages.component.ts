import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { AdminApiService } from '../../core/api/admin-api.service';
import { AdminInfoPageListItem } from '../../core/api/admin-info-page.models';
import { apiError } from '../../core/api/api-error';
import { TableRowLinkDirective } from '../../shared/directives/table-row-link.directive';

@Component({
  selector: 'app-info-pages',
  imports: [DatePipe, FormsModule, RouterLink, TableRowLinkDirective],
  templateUrl: './info-pages.component.html',
  styleUrl: './info-pages.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoPagesComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly items = signal<AdminInfoPageListItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly page = signal(1);
  readonly total = signal(0);
  readonly totalPages = signal(1);
  readonly queryParams = signal<Record<string, string>>({});
  filters: Record<string, string> = { isActive: '' };

  constructor() {
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          this.queryParams.set(
            Object.fromEntries(params.keys.map((key) => [key, params.get(key) ?? ''])),
          );
          this.page.set(Math.max(1, Number(params.get('page')) || 1));
          this.filters = { isActive: params.get('isActive') ?? '' };
          this.loading.set(true);
          this.error.set('');
          return this.api.infoPages(this.query(params)).pipe(
            catchError((error: unknown) => {
              this.loading.set(false);
              this.error.set(apiError(error, 'Information pages could not be loaded.'));
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.items.set(result.data);
        this.total.set(result.meta.total);
        this.totalPages.set(Math.max(1, result.meta.totalPages));
        this.loading.set(false);
      });
  }

  private query(params: ParamMap): Record<string, unknown> {
    const query: Record<string, unknown> = { page: this.page(), limit: 20 };
    const isActive = params.get('isActive');
    if (isActive) query['isActive'] = isActive;
    return query;
  }

  applyFilters() {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { isActive: this.filters['isActive'] || null, page: 1 },
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
