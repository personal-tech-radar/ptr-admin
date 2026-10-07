import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  EMPTY,
  Subject,
  catchError,
  distinctUntilChanged,
  map,
  merge,
  of,
  switchMap,
  timer,
} from 'rxjs';
import { AdminApiService } from '../../core/api/admin-api.service';
import { AdminPeriod, DashboardOverview } from '../../core/api/admin-dashboard.models';

type SourceGroup = DashboardOverview['sourceTypes'][number]['group'];

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refreshRequest = new Subject<void>();

  readonly periods: { value: AdminPeriod; label: string }[] = [
    { value: '24h', label: '24 hours' },
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
  ];
  readonly sourceGroupOrder: SourceGroup[] = ['web', 'feeds', 'github_release'];
  readonly sourceGroupLabels: Record<SourceGroup, string> = {
    web: 'Web',
    feeds: 'Feeds (RSS + Atom)',
    github_release: 'GitHub Releases',
  };
  readonly sourceGroupDescriptions: Record<SourceGroup, string> = {
    web: 'Discovered articles from websites.',
    feeds: 'Articles collected from RSS and Atom feeds.',
    github_release: 'Release updates collected from GitHub.',
  };
  readonly period = signal<AdminPeriod>('24h');
  readonly overview = signal<DashboardOverview | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly lastUpdated = signal<Date | null>(null);

  constructor() {
    this.route.queryParamMap
      .pipe(
        map((params): AdminPeriod => {
          const requested = params.get('period');
          return requested === '7d' || requested === '30d' ? requested : '24h';
        }),
        distinctUntilChanged(),
        switchMap((period) => {
          this.period.set(period);
          this.overview.set(null);
          return merge(of(null), timer(10000, 10000), this.refreshRequest).pipe(
            switchMap(() => {
              this.loading.set(this.overview() === null);
              return this.api.dashboard(period).pipe(
                catchError(() => {
                  this.loading.set(false);
                  this.error.set('The dashboard could not be refreshed. Try again.');
                  return EMPTY;
                }),
              );
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((overview) => {
        this.overview.set(overview);
        this.lastUpdated.set(new Date());
        this.loading.set(false);
        this.error.set('');
      });
  }

  setPeriod(value: string) {
    if (value === '24h' || value === '7d' || value === '30d') {
      void this.router.navigate([], { relativeTo: this.route, queryParams: { period: value } });
    }
  }

  refresh() {
    this.refreshRequest.next();
  }

  uptime(seconds: number): string {
    return `${Math.floor(seconds / 86400)}d ${Math.floor(seconds / 3600) % 24}h ${Math.floor(seconds / 60) % 60}m`;
  }
}
