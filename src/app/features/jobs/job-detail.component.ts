import { DatePipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/api/admin-api.service';
import { AdminJob, cancellableStates, jobReferencePath } from '../../core/api/admin-job.models';
import { apiError } from '../../core/api/api-error';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-job-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './job-detail.component.html',
  styleUrl: './job-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobDetailComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toasts = inject(ToastService);
  readonly job = signal<AdminJob | null>(null);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal('');
  readonly referencePath = jobReferencePath;
  readonly cancellableStates = cancellableStates;

  constructor() {
    this.load();
  }

  private load() {
    const queue = this.route.snapshot.paramMap.get('queue');
    const id = this.route.snapshot.paramMap.get('id');
    if (!queue || !id) return;
    this.loading.set(true);
    this.api
      .job(queue, id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (job) => {
          this.job.set(job);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.error.set(apiError(error, 'Job could not be loaded.'));
        },
      });
  }

  cancel() {
    const job = this.job();
    if (!job || !cancellableStates.includes(job.state) || this.pending()) return;
    if (!this.document.defaultView?.confirm(`Cancel pending ${job.type} job ${job.id}?`)) return;
    this.pending.set(true);
    this.error.set('');
    this.api
      .cancelJob(job.queue, job.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pending.set(false);
          this.toasts.success('Job cancelled.');
          this.load();
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.error.set(apiError(error, 'Job could not be cancelled.'));
        },
      });
  }
}
