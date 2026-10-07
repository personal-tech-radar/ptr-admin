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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, Observable, catchError, switchMap } from 'rxjs';
import { AdminApiService, Stream } from '../../core/api/admin-api.service';
import { apiError } from '../../core/api/api-error';
import { ToastService } from '../../core/toast.service';
import { TaxonomyItem, TaxonomyPage } from '../../core/api/admin-taxonomy.models';
import { TableRowLinkDirective } from '../../shared/directives/table-row-link.directive';

type Tab = 'technologies' | 'streams';

@Component({
  selector: 'app-taxonomy',
  imports: [FormsModule, RouterLink, TableRowLinkDirective],
  templateUrl: './taxonomy.component.html',
  styleUrl: './taxonomy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxonomyComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toasts = inject(ToastService);
  private readonly createDialog = viewChild<ElementRef<HTMLDialogElement>>('createDialog');
  readonly tab = signal<Tab>('technologies');
  readonly taxonomy = signal<TaxonomyItem[]>([]);
  readonly streams = signal<Stream[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly createError = signal('');
  readonly pending = signal(false);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);
  readonly editingStream = signal<Stream | null>(null);
  readonly editForm = { name: '', description: '', sortOrder: 0, enabled: true };
  readonly createForm: { name: string; kind: 'technology' | 'interest' } = {
    name: '',
    kind: 'technology',
  };
  filters: Record<string, string> = {};

  constructor() {
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          const tab: Tab = params.get('tab') === 'streams' ? 'streams' : 'technologies';
          this.tab.set(tab);
          this.page.set(Math.max(1, Number(params.get('page')) || 1));
          const keys = tab === 'technologies' ? ['q', 'kind'] : [];
          this.filters = Object.fromEntries(keys.map((key) => [key, params.get(key) ?? '']));
          this.loading.set(true);
          this.error.set('');
          const query: Record<string, unknown> = { page: this.page(), limit: 20 };
          for (const key of keys) {
            const value = params.get(key);
            if (value) query[key] = value;
          }
          const request: Observable<Stream[] | TaxonomyPage> =
            tab === 'streams' ? this.api.streams() : this.api.taxonomy(query);
          return request.pipe(
            catchError((error: unknown) => {
              this.loading.set(false);
              this.error.set(apiError(error, 'Taxonomy data could not be loaded.'));
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (Array.isArray(result)) {
          this.streams.set(result);
          this.total.set(result.length);
          this.totalPages.set(1);
        } else {
          this.taxonomy.set(result.data);
          this.total.set(result.meta.total);
          this.totalPages.set(Math.max(1, result.meta.totalPages));
        }
        this.loading.set(false);
      });
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

  openCreate() {
    this.createError.set('');
    this.createDialog()?.nativeElement.showModal();
  }

  closeCreate() {
    this.createDialog()?.nativeElement.close();
  }

  create() {
    if (!this.createForm.name.trim() || this.pending()) return;
    this.pending.set(true);
    this.createError.set('');
    this.api
      .createTaxonomy({ name: this.createForm.name.trim(), kind: this.createForm.kind })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.pending.set(false);
          this.closeCreate();
          this.toasts.success(result.message);
          void this.router.navigate(['/taxonomy', result.taxonomy.id]);
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.createError.set(apiError(error, 'Topic could not be created.'));
        },
      });
  }

  startEdit(stream: Stream) {
    this.editingStream.set(stream);
    Object.assign(this.editForm, {
      name: stream.name,
      description: stream.description ?? '',
      sortOrder: stream.sortOrder,
      enabled: stream.enabled,
    });
  }

  editStreamFromRow(event: MouseEvent, stream: Stream) {
    const target = event.target;
    if (target instanceof Element && target.closest('a, button, input, select, textarea')) return;
    this.startEdit(stream);
  }

  editStreamFromKey(event: Event, stream: Stream) {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    this.startEdit(stream);
  }

  saveStream() {
    const item = this.editingStream();
    if (!item || this.pending()) return;
    this.pending.set(true);
    this.error.set('');
    this.api
      .updateStream(item.id, { ...this.editForm })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.streams.update((items) =>
            items.map((entry) => (entry.id === updated.id ? updated : entry)),
          );
          this.editingStream.set(null);
          this.pending.set(false);
          this.toasts.success('Stream updated.');
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.error.set(apiError(error, 'Stream could not be updated.'));
        },
      });
  }
}
