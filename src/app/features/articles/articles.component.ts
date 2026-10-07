import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, forkJoin, switchMap } from 'rxjs';
import { AdminApiService, Stream } from '../../core/api/admin-api.service';
import { AdminArticle } from '../../core/api/admin-article.models';
import { apiError } from '../../core/api/api-error';
import { AdminSource } from '../../core/api/admin-source.models';
import { TaxonomyItem } from '../../core/api/admin-taxonomy.models';
import { TableRowLinkDirective } from '../../shared/directives/table-row-link.directive';

const filterKeys = [
  'q',
  'status',
  'sourceId',
  'sourceType',
  'sourceGroup',
  'technologyInterestId',
  'streamId',
  'receivedFrom',
  'receivedTo',
  'publishedFrom',
  'publishedTo',
];

@Component({
  selector: 'app-articles',
  imports: [DatePipe, FormsModule, RouterLink, TableRowLinkDirective],
  templateUrl: './articles.component.html',
  styleUrl: './articles.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticlesComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly articles = signal<AdminArticle[]>([]);
  readonly sources = signal<AdminSource[]>([]);
  readonly taxonomy = signal<TaxonomyItem[]>([]);
  readonly streams = signal<Stream[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly filterOptionsError = signal('');
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);
  filters: Record<string, string> = {};

  constructor() {
    forkJoin({
      sources: this.api.sources({ page: 1, limit: 100 }),
      taxonomy: this.api.taxonomy({ page: 1, limit: 100 }),
      streams: this.api.streams(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ sources, taxonomy, streams }) => {
          this.sources.set(sources.data);
          this.taxonomy.set(taxonomy.data);
          this.streams.set(streams);
        },
        error: (error: unknown) =>
          this.filterOptionsError.set(
            apiError(error, 'Article filter options could not be loaded.'),
          ),
      });
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          this.page.set(Math.max(1, Number(params.get('page')) || 1));
          this.filters = Object.fromEntries(filterKeys.map((key) => [key, params.get(key) ?? '']));
          this.loading.set(true);
          this.error.set('');
          return this.api.articles(this.query(params)).pipe(
            catchError((error: unknown) => {
              this.loading.set(false);
              this.error.set(apiError(error, 'Articles could not be loaded.'));
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.articles.set(result.data);
        this.total.set(result.meta.total);
        this.totalPages.set(Math.max(1, result.meta.totalPages));
        this.loading.set(false);
      });
  }

  private query(params: ParamMap): Record<string, unknown> {
    const result: Record<string, unknown> = { page: this.page(), limit: 20 };
    for (const key of filterKeys) {
      const value = params.get(key);
      if (value) result[key] = value;
    }
    return result;
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
}
