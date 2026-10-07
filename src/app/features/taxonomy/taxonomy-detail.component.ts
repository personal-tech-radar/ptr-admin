import { DatePipe, DOCUMENT } from '@angular/common';
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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/api/admin-api.service';
import { apiError } from '../../core/api/api-error';
import { ToastService } from '../../core/toast.service';
import { TaxonomyItem } from '../../core/api/admin-taxonomy.models';

@Component({
  selector: 'app-taxonomy-detail',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './taxonomy-detail.component.html',
  styleUrl: './taxonomy-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxonomyDetailComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toasts = inject(ToastService);
  private readonly discoverDialog = viewChild<ElementRef<HTMLDialogElement>>('discoverDialog');
  readonly item = signal<TaxonomyItem | null>(null);
  readonly options = signal<TaxonomyItem[]>([]);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal('');
  readonly discoverError = signal('');
  form = { name: '', aliases: '' };
  loserId = '';

  constructor() {
    this.loadPage(1);
  }

  private loadPage(page: number) {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.api
      .taxonomy({ page, limit: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.options.update((items) => [...items, ...result.data]);
          const found = result.data.find((entry) => entry.id === id);
          if (found) {
            this.item.set(found);
            this.form = { name: found.name, aliases: found.aliases.join(', ') };
          }
          if (page < result.meta.totalPages) this.loadPage(page + 1);
          else {
            this.loading.set(false);
            if (!this.item()) this.error.set('Topic not found.');
          }
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.error.set(apiError(error, 'Topic could not be loaded.'));
        },
      });
  }

  save() {
    const item = this.item();
    if (!item || this.pending()) return;
    this.pending.set(true);
    this.error.set('');
    this.api
      .updateTaxonomy(item.id, {
        name: this.form.name.trim(),
        aliases: this.form.aliases
          .split(',')
          .map((alias) => alias.trim())
          .filter(Boolean),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.item.set({ ...item, ...updated });
          this.pending.set(false);
          this.toasts.success('Topic updated.');
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.error.set(apiError(error, 'Topic could not be updated.'));
        },
      });
  }

  merge() {
    const item = this.item();
    const loser = this.options().find((option) => option.id === this.loserId);
    if (!item || !loser || loser.id === item.id || this.pending()) return;
    if (
      !this.document.defaultView?.confirm(
        `Merge “${loser.name}” into “${item.name}”? “${item.name}” will remain the winner.`,
      )
    )
      return;
    this.pending.set(true);
    this.error.set('');
    this.api
      .mergeTaxonomy({ winnerId: item.id, loserId: loser.id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pending.set(false);
          this.toasts.success(`Merged ${loser.name} into ${item.name}.`);
          this.options.update((options) => options.filter((option) => option.id !== loser.id));
          this.loserId = '';
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.error.set(apiError(error, 'Merge failed.'));
        },
      });
  }

  openDiscoverConfirmation() {
    this.discoverError.set('');
    this.discoverDialog()?.nativeElement.showModal();
  }

  closeDiscoverConfirmation() {
    this.discoverDialog()?.nativeElement.close();
  }

  discover() {
    const item = this.item();
    if (!item || this.pending()) return;
    this.pending.set(true);
    this.discoverError.set('');
    this.api
      .discoverSources(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pending.set(false);
          this.closeDiscoverConfirmation();
          this.toasts.success('Source discovery queued.');
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.discoverError.set(apiError(error, 'Source discovery failed.'));
        },
      });
  }
}
