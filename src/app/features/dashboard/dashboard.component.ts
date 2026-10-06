import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer, switchMap, catchError, of, forkJoin } from 'rxjs';
import { RouterLink } from '@angular/router';
import { AdminApiService, Health } from '../../core/api/admin-api.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly api = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly health = signal<Health | null>(null);
  readonly error = signal('');
  readonly lastUpdated = signal<Date | null>(null);
  readonly stats = signal({ users: 0, sources: 0, articles: 0, digestsSent: 0, failedJobs: 0 });
  constructor() {
    timer(0, 20000)
      .pipe(
        switchMap(() =>
          forkJoin({
            health: this.api.health(),
            users: this.api.users({ page: 1, limit: 1 }),
            sources: this.api.sources({ page: 1, limit: 1 }),
            articles: this.api.articles({ page: 1, limit: 1 }),
            digests: this.api.digests({ page: 1, limit: 1, status: 'sent' }),
            jobs: this.api.failedJobs({ page: 1, limit: 1 }),
          }).pipe(
            catchError(() => {
              this.error.set('Health endpoint is temporarily unavailable.');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        if (value) {
          this.health.set(value.health);
          this.stats.set({
            users: value.users.meta.total,
            sources: value.sources.meta.total,
            articles: value.articles.meta.total,
            digestsSent: value.digests.meta.total,
            failedJobs: value.jobs.meta.total,
          });
          this.error.set('');
          this.lastUpdated.set(new Date());
        }
      });
  }
  uptime() {
    const seconds = this.health()?.uptime ?? 0;
    return `${Math.floor(seconds / 86400)}d ${Math.floor(seconds / 3600) % 24}h ${Math.floor(seconds / 60) % 60}m`;
  }
}
