import { DatePipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminApiService } from '../../core/api/admin-api.service';
import { apiError } from '../../core/api/api-error';
import {
  AdminUser,
  AdminUserListItem,
  SourcePreference,
  UserEvent,
} from '../../core/api/admin-user.models';

@Component({
  selector: 'app-user-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  readonly user = signal<AdminUser | null>(null);
  readonly listItem = signal<AdminUserListItem | null>(null);
  readonly preferences = signal<SourcePreference[]>([]);
  readonly opens = signal<UserEvent[]>([]);
  readonly saves = signal<UserEvent[]>([]);
  readonly feedback = signal<UserEvent[]>([]);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal('');

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.api
      .user(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.loadRelated(user);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.error.set(apiError(error, 'User could not be loaded.'));
        },
      });
  }

  private loadRelated(user: AdminUser) {
    forkJoin({
      list: this.api.users({ email: user.email, page: 1, limit: 20 }),
      preferences: this.api.userSourcePreferences({ userId: user.id, page: 1, limit: 20 }),
      opens: this.api.userOpens({ userId: user.id, page: 1, limit: 5, opened: true }),
      saves: this.api.userSaves({ userId: user.id, page: 1, limit: 5 }),
      feedback: this.api.userFeedback({ userId: user.id, page: 1, limit: 5 }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.listItem.set(data.list.data.find((item) => item.id === user.id) ?? null);
          this.preferences.set(data.preferences.data);
          this.opens.set(data.opens.data);
          this.saves.set(data.saves.data);
          this.feedback.set(data.feedback.data);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.error.set(apiError(error, 'Related user data could not be loaded.'));
        },
      });
  }

  digestLink(email: string): string {
    return `/digests?email=${encodeURIComponent(email)}`;
  }

  delete() {
    const user = this.user();
    if (!user || this.pending()) return;
    if (!this.document.defaultView?.confirm(`Soft-delete user ${user.email}?`)) return;
    this.pending.set(true);
    this.error.set('');
    this.api
      .deleteUser(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigate(['/users']),
        error: (error: unknown) => {
          this.pending.set(false);
          this.error.set(apiError(error, 'User could not be deleted.'));
        },
      });
  }
}
