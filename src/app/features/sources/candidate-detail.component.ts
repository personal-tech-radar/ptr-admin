import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/api/admin-api.service';
import { apiError } from '../../core/api/api-error';
import { ToastService } from '../../core/toast.service';
import { SourceCandidate } from '../../core/api/admin-source.models';

@Component({
  selector: 'app-candidate-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './candidate-detail.component.html',
  styleUrl: './source-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidateDetailComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toasts = inject(ToastService);
  readonly candidate = signal<SourceCandidate | null>(null);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal('');
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api
      .candidate(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (candidate) => {
          this.candidate.set(candidate);
          this.loading.set(false);
          this.error.set('');
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.error.set(apiError(error, 'The candidate could not be loaded.'));
        },
      });
  }

  retry() {
    if (this.pending()) return;
    this.pending.set(true);
    this.api
      .retryCandidate(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pending.set(false);
          this.toasts.success('Onboarding retry accepted.');
          this.load();
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.error.set(apiError(error, 'The retry could not be submitted.'));
        },
      });
  }
}
