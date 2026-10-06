import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AdminApiService, AdministratorPage, Page } from '../../core/api/admin-api.service';

type Row = Record<string, unknown>;
interface FilterOption {
  value: string;
  label: string;
}
const titles: Record<string, [string, string]> = {
  articles: ['Articles', 'Inspect ingestion and analysis state.'],
  sources: ['Sources', 'Operate feeds, web sources and validation health.'],
  taxonomy: ['Taxonomy', 'Manage canonical technologies, interests and streams.'],
  coverage: ['Coverage', 'Find taxonomy and stream combinations without active sources.'],
  users: ['Users', 'Support normal users and inspect derived activity.'],
  digests: ['Digests', 'Review delivery history and create administrator previews.'],
  jobs: ['Jobs', 'Inspect failed jobs and safely cancel pending work.'],
  admins: ['Administrators', 'Manage administrator access.'],
};

@Component({
  selector: 'app-admin-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AdminApiService);
  readonly resource = this.route.snapshot.data['resource'] as string;
  readonly title = titles[this.resource]?.[0] ?? this.resource;
  readonly description = titles[this.resource]?.[1] ?? '';
  readonly rows = signal<Row[]>([]);
  readonly detail = signal<Row | null>(null);
  readonly pending = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly confirmingDelete = signal<Row | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  search = '';
  filterValue = '';
  readonly mode = signal(this.resource === 'taxonomy' ? 'taxonomy' : 'sources');
  readonly form = {
    name: '',
    email: '',
    password: '',
    url: '',
    type: 'rss',
    category: 'engineering_deep_dives',
    enabled: true,
    trustScore: 50,
    kind: 'technology',
    aliases: '',
  };
  constructor() {
    this.load();
  }

  filterOptions(): FilterOption[] {
    if (this.resource === 'articles')
      return [
        { value: 'status:new', label: 'New' },
        { value: 'status:pending_analysis', label: 'Pending analysis' },
        { value: 'status:analyzed', label: 'Analyzed' },
        { value: 'status:failed', label: 'Failed' },
      ];
    if (this.resource === 'sources' && this.mode() === 'candidates')
      return [
        { value: 'status:pending', label: 'Pending' },
        { value: 'status:active', label: 'Active' },
        { value: 'status:rejected', label: 'Rejected' },
      ];
    if (this.resource === 'sources')
      return [
        { value: 'status:active', label: 'Active' },
        { value: 'status:degraded', label: 'Degraded' },
        { value: 'status:disabled', label: 'Disabled' },
        { value: 'type:rss', label: 'RSS' },
        { value: 'type:atom', label: 'Atom' },
        { value: 'type:web', label: 'Web' },
      ];
    if (this.resource === 'taxonomy')
      return [
        { value: 'kind:technology', label: 'Technologies' },
        { value: 'kind:interest', label: 'Interests' },
      ];
    if (this.resource === 'coverage')
      return [
        { value: 'kind:technology', label: 'Technologies' },
        { value: 'kind:interest', label: 'Interests' },
        { value: 'zeroActiveCoverage:true', label: 'Zero active coverage' },
        { value: 'sourceStatus:degraded', label: 'Degraded sources' },
      ];
    if (this.resource === 'digests')
      return [
        { value: 'status:sent', label: 'Sent' },
        { value: 'status:failed', label: 'Failed' },
        { value: 'type:daily', label: 'Daily' },
        { value: 'type:weekly', label: 'Weekly' },
      ];
    if (this.resource === 'users')
      return [{ value: 'includeDeleted:true', label: 'Include deleted' }];
    return [];
  }
  load() {
    this.pending.set(true);
    this.error.set('');
    const q: Record<string, unknown> = { page: this.page(), limit: 20 };
    if (this.filterValue) {
      const [key, value] = this.filterValue.split(':');
      q[key] = value === 'true' ? true : value;
    }
    if (this.resource === 'users' || this.resource === 'admins')
      q[this.resource === 'users' ? 'email' : 'email'] = this.search || undefined;
    const request: Observable<unknown> =
      this.resource === 'articles'
        ? this.api.articles(q)
        : this.resource === 'sources' && this.mode() === 'candidates'
          ? this.api.candidates(q)
          : this.resource === 'sources'
            ? this.api.sources(q)
            : this.resource === 'taxonomy' && this.mode() === 'streams'
              ? this.api.streams()
              : this.resource === 'taxonomy'
                ? this.api.taxonomy(q)
                : this.resource === 'coverage'
                  ? this.api.coverage(q)
                  : this.resource === 'users'
                    ? this.api.users(q)
                    : this.resource === 'digests'
                      ? this.api.digests(q)
                      : this.resource === 'jobs'
                        ? this.api.failedJobs({ queue: this.search || undefined, ...q })
                        : this.api.admins(q);
    request.subscribe({
      next: (result) => this.applyResult(result),
      error: (e: { error?: { message?: string } }) => {
        this.pending.set(false);
        this.error.set(e.error?.message ?? 'The API could not load this collection.');
      },
    });
  }
  private applyResult(result: unknown) {
    if (this.resource === 'admins') {
      const page = result as AdministratorPage;
      this.rows.set(page.items.map((item) => item as unknown as Row));
      this.totalPages.set(Math.max(1, Math.ceil(page.total / page.limit)));
    } else if (this.resource === 'taxonomy' && this.mode() === 'streams') {
      const streams = result as Row[];
      this.rows.set(streams);
      this.totalPages.set(1);
    } else {
      const page = result as Page<Row>;
      this.rows.set(page.data ?? []);
      this.totalPages.set(page.meta?.totalPages ?? 1);
    }
    this.pending.set(false);
  }
  applyFilters() {
    this.page.set(1);
    this.load();
  }
  open(row: Row) {
    this.detail.set(row);
    this.notice.set('');
  }
  close() {
    this.detail.set(null);
    this.notice.set('');
    this.confirmingDelete.set(null);
  }
  changePage(delta: number) {
    const next = this.page() + delta;
    if (next >= 1 && next <= this.totalPages()) {
      this.page.set(next);
      this.load();
    }
  }
  label(key: string) {
    const names: Record<string, string> = {
      rawContent: 'Content',
      rawData: 'Content data',
      summaryFromFeed: 'Feed summary',
      urlHash: 'URL fingerprint',
      failedReason: 'Failure reason',
    };
    return (
      names[key] ??
      key.replace(/[A-Z]/g, (m) => ` ${m.toLowerCase()}`).replace(/^./, (m) => m.toUpperCase())
    );
  }
  value(row: Row, key: string) {
    const value = row[key];
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return `${value as string | number | boolean}`;
  }
  keys(row: Row) {
    return Object.keys(row)
      .filter((k) => !['id', 'urlHash'].includes(k))
      .slice(0, 16);
  }
  columns() {
    const examples: Record<string, string[]> = {
      articles: ['status', 'title', 'sourceId', 'publishedAt', 'createdAt'],
      sources: ['status', 'name', 'url', 'type', 'category', 'enabled'],
      taxonomy: ['kind', 'name', 'aliases', 'updatedAt'],
      coverage: [
        'activeSources',
        'name',
        'kind',
        'streamKey',
        'degradedSources',
        'disabledSources',
      ],
      users: ['email', 'displayName', 'level', 'onboardingCompletedAt', 'createdAt'],
      digests: ['status', 'userEmail', 'type', 'deliveryMode', 'createdAt'],
      jobs: ['failedReason', 'queue', 'name', 'id', 'timestamp'],
      admins: ['email', 'lastLoginAt', 'createdAt'],
    };
    if (this.resource === 'taxonomy' && this.mode() === 'streams')
      return ['name', 'key', 'description', 'sortOrder', 'enabled'];
    if (this.resource === 'sources' && this.mode() === 'candidates')
      return ['status', 'domain', 'normalizedUrl', 'detectedType', 'rejectionCode', 'createdAt'];
    return examples[this.resource] ?? [];
  }
  addSupported() {
    return (
      this.resource === 'sources' || this.resource === 'admins' || this.resource === 'taxonomy'
    );
  }
  actionLabel() {
    return this.resource === 'admins'
      ? 'Add administrator'
      : this.resource === 'taxonomy'
        ? 'Add taxonomy'
        : 'Add source';
  }
  saveNew() {
    if (this.resource === 'taxonomy') {
      this.notice.set(
        'The current admin API does not expose taxonomy creation. Ask the backend to add this endpoint.',
      );
      return;
    }
    const body =
      this.resource === 'sources'
        ? { ...this.form, webConfig: this.form.type === 'web' ? undefined : undefined }
        : { email: this.form.email, password: this.form.password };
    const request = (
      this.resource === 'sources' ? this.api.createSource(body) : this.api.createAdmin(body)
    ) as Observable<unknown>;
    request.subscribe({
      next: () => {
        this.close();
        this.load();
      },
      error: (e: { error?: { message?: string } }) =>
        this.error.set(e.error?.message ?? 'Create operation failed.'),
    });
  }
  retry(row: Row) {
    const id = String(row['id']);
    const queue = typeof row['queue'] === 'string' ? row['queue'] : 'default';
    const request =
      this.resource === 'articles'
        ? this.api.retryArticle(id)
        : this.resource === 'jobs'
          ? this.api.cancelJob(queue, id)
          : this.api.retryCandidate(id);
    request.subscribe({
      next: () => {
        this.notice.set(this.resource === 'jobs' ? 'Cancellation requested.' : 'Retry accepted.');
        this.close();
        this.load();
      },
      error: (e: { error?: { message?: string } }) =>
        this.error.set(e.error?.message ?? 'Operation failed.'),
    });
  }
  sourceAction(row: Row, action: 'activate' | 'disable' | 'retry-validation' | 'retry-ingestion') {
    this.api.sourceAction(String(row['id']), action).subscribe({
      next: () => {
        this.notice.set('Source action accepted.');
        this.close();
        this.load();
      },
      error: (e: { error?: { message?: string } }) =>
        this.error.set(e.error?.message ?? 'Source action failed.'),
    });
  }
  discover(row: Row) {
    this.api.discoverSources(String(row['id'])).subscribe({
      next: () => this.notice.set('Source discovery accepted.'),
      error: (e: { error?: { message?: string } }) =>
        this.error.set(e.error?.message ?? 'Discovery failed.'),
    });
  }
  articleDelete(row: Row) {
    this.api.deleteArticle(String(row['id'])).subscribe({
      next: () => {
        this.close();
        this.load();
      },
      error: (e: { error?: { message?: string } }) =>
        this.error.set(e.error?.message ?? 'Delete failed.'),
    });
  }
  askDelete(row: Row) {
    this.confirmingDelete.set(row);
  }
}
