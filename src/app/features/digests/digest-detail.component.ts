import { DatePipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/api/admin-api.service';
import { DigestDetail } from '../../core/api/admin-digest.models';
import { apiError } from '../../core/api/api-error';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-digest-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './digest-detail.component.html',
  styleUrl: './digest-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigestDetailComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toasts = inject(ToastService);
  readonly digest = signal<DigestDetail | null>(null);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal('');

  constructor() {
    this.load();
  }

  private load() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading.set(true);
    this.api
      .digest(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (digest) => {
          this.digest.set(digest);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.error.set(apiError(error, 'Digest could not be loaded.'));
        },
      });
  }

  resend() {
    const item = this.digest();
    if (!item || this.pending()) return;
    if (
      !this.document.defaultView?.confirm(
        `Resend this stored ${item.type} digest to ${item.actualRecipientEmail ?? item.userEmail ?? 'its stored recipient'}?`,
      )
    )
      return;
    this.pending.set(true);
    this.error.set('');
    this.api
      .resendDigest(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pending.set(false);
          this.toasts.success('Stored digest queued for resend.');
          this.load();
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.error.set(apiError(error, 'Digest could not be resent.'));
        },
      });
  }
}
