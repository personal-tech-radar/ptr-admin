import { DatePipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/api/admin-api.service';
import { apiError } from '../../core/api/api-error';
import { ToastService } from '../../core/toast.service';
import { AdminPeriod } from '../../core/api/admin-dashboard.models';
import { SourceDetail } from '../../core/api/admin-source.models';

@Component({
  selector: 'app-source-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './source-detail.component.html',
  styleUrl: './source-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceDetailComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toasts = inject(ToastService);
  readonly source = signal<SourceDetail | null>(null);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal('');
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  private period(): AdminPeriod {
    const value = this.route.snapshot.queryParamMap.get('period');
    return value === '7d' || value === '30d' ? value : '24h';
  }

  load() {
    this.loading.set(true);
    this.api
      .source(this.id, this.period())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (source) => {
          this.source.set(source);
          this.loading.set(false);
          this.error.set('');
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.error.set(apiError(error, 'The source could not be loaded.'));
        },
      });
  }

  action(action: 'activate' | 'disable' | 'retry-validation' | 'retry-ingestion') {
    if (this.pending()) return;
    this.pending.set(true);
    this.api
      .sourceAction(this.id, action)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pending.set(false);
          this.toasts.success('Source action accepted.');
          this.load();
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.error.set(apiError(error, 'The source action failed.'));
        },
      });
  }

  remove() {
    if (this.pending() || !this.document.defaultView?.confirm('Soft-delete this source?')) return;
    this.pending.set(true);
    this.api
      .deleteSource(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigateByUrl('/sources'),
        error: (error: unknown) => {
          this.pending.set(false);
          this.error.set(apiError(error, 'The source could not be deleted.'));
        },
      });
  }
}
