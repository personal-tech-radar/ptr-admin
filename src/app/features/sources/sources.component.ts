import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { EMPTY, Observable, catchError, forkJoin, switchMap } from 'rxjs';
import { AdminApiService, Page, Stream } from '../../core/api/admin-api.service';
import { apiError } from '../../core/api/api-error';
import { ToastService } from '../../core/toast.service';
import { AdminPeriod } from '../../core/api/admin-dashboard.models';
import { TableRowLinkDirective } from '../../shared/directives/table-row-link.directive';
import { TaxonomyItem } from '../../core/api/admin-taxonomy.models';
import {
  AdminSource,
  CreateSource,
  SourceCandidate,
  SourceCategory,
  SourcePage,
  SourceType,
} from '../../core/api/admin-source.models';

type SourceTab = 'sources' | 'candidates';
type SourceFilters = Record<string, string>;
const sourceFilterKeys = [
  'q',
  'status',
  'type',
  'sourceGroup',
  'category',
  'enabled',
  'createdFrom',
  'createdTo',
  'technologyInterestId',
  'streamId',
  'period',
];
const candidateFilterKeys = [
  'status',
  'origin',
  'expectedSourceType',
  'detectedType',
  'technologyInterestId',
  'streamId',
  'createdFrom',
  'createdTo',
];

@Component({
  selector: 'app-sources',
  imports: [DatePipe, FormsModule, RouterLink, TableRowLinkDirective],
  templateUrl: './sources.component.html',
  styleUrl: './sources.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourcesComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toasts = inject(ToastService);
  private readonly createDialog = viewChild<ElementRef<HTMLDialogElement>>('createDialog');

  readonly tab = signal<SourceTab>('sources');
  readonly sources = signal<AdminSource[]>([]);
  readonly candidates = signal<SourceCandidate[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly filterOptionsError = signal('');
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);
  readonly sourcePeriod = signal<SourcePage['period'] | null>(null);
  readonly createdId = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly createError = signal('');
  readonly taxonomyOptions = signal<TaxonomyItem[]>([]);
  readonly streamOptions = signal<Stream[]>([]);
  filters: SourceFilters = {};
  createForm: CreateSource = {
    name: '',
    url: '',
    type: 'rss',
    category: 'engineering_deep_dives',
  };

  readonly sourceTypes: SourceType[] = ['rss', 'atom', 'web', 'github_release'];
  readonly sourceCategories: SourceCategory[] = [
    'backend_architecture_infra',
    'engineering_deep_dives',
    'node_typescript_nestjs',
    'ai_engineering',
  ];

  constructor() {
    forkJoin({ taxonomy: this.api.taxonomy({ page: 1, limit: 100 }), streams: this.api.streams() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ taxonomy, streams }) => {
          this.taxonomyOptions.set(taxonomy.data);
          this.streamOptions.set(streams);
        },
        error: (error: unknown) =>
          this.filterOptionsError.set(
            apiError(error, 'Source filter options could not be loaded.'),
          ),
      });

    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          const tab: SourceTab = params.get('tab') === 'candidates' ? 'candidates' : 'sources';
          this.tab.set(tab);
          this.page.set(Math.max(1, Number(params.get('page')) || 1));
          const keys = tab === 'sources' ? sourceFilterKeys : candidateFilterKeys;
          this.filters = Object.fromEntries(keys.map((key) => [key, params.get(key) ?? '']));
          this.loading.set(true);
          this.error.set('');
          const query = this.query(params, keys);
          const request: Observable<SourcePage | Page<SourceCandidate>> =
            tab === 'sources' ? this.api.sources(query) : this.api.candidates(query);
          return request.pipe(
            catchError((error: unknown) => {
              this.loading.set(false);
              this.error.set(apiError(error, 'The list could not be loaded.'));
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (this.tab() === 'sources') {
          const page = result as SourcePage;
          this.sources.set(page.data);
          this.sourcePeriod.set(page.period);
        } else {
          this.candidates.set((result as Page<SourceCandidate>).data);
        }
        this.total.set(result.meta.total);
        this.totalPages.set(Math.max(1, result.meta.totalPages));
        this.loading.set(false);
      });
  }

  private query(params: ParamMap, keys: string[]): Record<string, unknown> {
    const query: Record<string, unknown> = { page: this.page(), limit: 20 };
    for (const key of keys) {
      const value = params.get(key);
      if (value) query[key] = value;
    }
    return query;
  }

  setTab(tab: SourceTab) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: tab === 'candidates' ? { tab } : {},
    });
  }

  applyFilters() {
    const queryParams = Object.fromEntries(
      Object.entries(this.filters).filter(([, value]) => value),
    );
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        ...queryParams,
        ...(this.tab() === 'candidates' ? { tab: 'candidates' } : {}),
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

  openCreate() {
    this.createError.set('');
    this.createDialog()?.nativeElement.showModal();
  }

  closeCreate() {
    this.createDialog()?.nativeElement.close();
  }

  create() {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.createError.set('');
    this.api
      .createSource(this.createForm)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (source) => {
          this.submitting.set(false);
          this.closeCreate();
          this.createdId.set(source.id);
          this.toasts.success(`Created ${source.name}.`);
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { q: source.name, page: 1 },
          });
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.createError.set(apiError(error, 'The source could not be created.'));
        },
      });
  }

  engagement(source: AdminSource): string {
    return source.includedSignalCount > 0 ? String(source.interactionScore) : '—';
  }

  periodValue(): AdminPeriod {
    const value = this.filters['period'];
    return value === '7d' || value === '30d' ? value : '24h';
  }
}
