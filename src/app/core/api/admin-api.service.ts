import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { APP_CONFIG } from '../config/app-config';
import { AdminPeriod, DashboardOverview } from './admin-dashboard.models';
import { ArticleDetail, ArticlePage } from './admin-article.models';
import { CreateTaxonomyResponse, TaxonomyItem, TaxonomyPage } from './admin-taxonomy.models';
import { AdminJob, JobPage, QueueSummary } from './admin-job.models';
import { AdminDigest, DigestDetail, DigestPage } from './admin-digest.models';
import { AdminUser, SourcePreference, UserEvent, UserPage } from './admin-user.models';
import {
  AdminSource,
  CreateSource,
  SourceCandidate,
  SourceDetail,
  SourcePage,
} from './admin-source.models';

export interface Page<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
export interface AdministratorPage {
  items: Administrator[];
  total: number;
  page: number;
  limit: number;
}
export interface Stream {
  id: string;
  key: string;
  name: string;
  description?: string;
  sortOrder: number;
  enabled: boolean;
}
export interface Administrator {
  id: string;
  email: string;
  lastLoginAt?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private url(path: string) {
    return `${this.config.apiBaseUrl}${path}`;
  }
  private params(query: Record<string, unknown>) {
    let p = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        const rendered =
          typeof v === 'object' && v !== null
            ? (JSON.stringify(v) ?? '')
            : `${v as string | number | boolean}`;
        p = p.set(k, rendered);
      }
    });
    return p;
  }
  dashboard(period: AdminPeriod) {
    return this.http.get<DashboardOverview>(this.url('/admin/dashboard/overview'), {
      params: this.params({ period }),
    });
  }
  articles(q: Record<string, unknown>) {
    return this.http.get<ArticlePage>(this.url('/admin/articles'), { params: this.params(q) });
  }
  article(id: string) {
    return this.http.get<ArticleDetail>(this.url(`/admin/articles/${id}`));
  }
  retryArticle(id: string) {
    return this.http.post(this.url(`/admin/articles/${id}/retry-analysis`), {});
  }
  deleteArticle(id: string) {
    return this.http.delete(this.url(`/admin/articles/${id}`));
  }
  sources(q: Record<string, unknown>) {
    return this.http.get<SourcePage>(this.url('/admin/sources'), { params: this.params(q) });
  }
  source(id: string, period: AdminPeriod = '24h') {
    return this.http.get<SourceDetail>(this.url(`/admin/sources/${id}`), {
      params: this.params({ period }),
    });
  }
  createSource(body: CreateSource) {
    return this.http.post<AdminSource>(this.url('/admin/sources'), body);
  }
  deleteSource(id: string) {
    return this.http.delete(this.url(`/admin/sources/${id}`));
  }
  sourceAction(
    id: string,
    action: 'activate' | 'disable' | 'retry-validation' | 'retry-ingestion',
  ) {
    return this.http.post(this.url(`/admin/sources/${id}/${action}`), {});
  }
  candidates(q: Record<string, unknown>) {
    return this.http.get<Page<SourceCandidate>>(this.url('/admin/source-candidates'), {
      params: this.params(q),
    });
  }
  candidate(id: string) {
    return this.http.get<SourceCandidate>(this.url(`/admin/source-candidates/${id}`));
  }
  retryCandidate(id: string) {
    return this.http.post(this.url(`/admin/source-candidates/${id}/retry`), {});
  }
  taxonomy(q: Record<string, unknown>) {
    return this.http.get<TaxonomyPage>(this.url('/admin/technology-interests'), {
      params: this.params(q),
    });
  }
  createTaxonomy(body: { name: string; kind: 'technology' | 'interest' }) {
    return this.http.post<CreateTaxonomyResponse>(this.url('/admin/technology-interests'), body);
  }
  updateTaxonomy(id: string, body: { name?: string; aliases?: string[] }) {
    return this.http.patch<TaxonomyItem>(this.url(`/admin/technology-interests/${id}`), body);
  }
  mergeTaxonomy(body: { winnerId: string; loserId: string }) {
    return this.http.post(this.url('/admin/technology-interests/merge'), body);
  }
  discoverSources(id: string) {
    return this.http.post(this.url(`/admin/technology-interests/${id}/discover-sources`), {});
  }
  streams() {
    return this.http.get<Stream[]>(this.url('/admin/content-streams'), {
      params: this.params({ includeDisabled: true }),
    });
  }
  updateStream(id: string, body: unknown) {
    return this.http.patch<Stream>(this.url(`/admin/content-streams/${id}`), body);
  }
  users(q: Record<string, unknown>) {
    return this.http.get<UserPage>(this.url('/admin/users'), { params: this.params(q) });
  }
  user(id: string) {
    return this.http.get<AdminUser>(this.url(`/admin/users/${id}`));
  }
  userSourcePreferences(q: Record<string, unknown>) {
    return this.http.get<Page<SourcePreference>>(this.url('/admin/user-source-preferences'), {
      params: this.params(q),
    });
  }
  userOpens(q: Record<string, unknown>) {
    return this.http.get<Page<UserEvent>>(this.url('/admin/opens'), { params: this.params(q) });
  }
  userSaves(q: Record<string, unknown>) {
    return this.http.get<Page<UserEvent>>(this.url('/admin/saved-articles'), {
      params: this.params(q),
    });
  }
  userFeedback(q: Record<string, unknown>) {
    return this.http.get<Page<UserEvent>>(this.url('/admin/article-feedback'), {
      params: this.params(q),
    });
  }
  deleteUser(id: string) {
    return this.http.delete(this.url(`/admin/users/${id}`));
  }
  digests(q: Record<string, unknown>) {
    return this.http.get<DigestPage>(this.url('/admin/digests'), { params: this.params(q) });
  }
  digest(id: string) {
    return this.http.get<DigestDetail>(this.url(`/admin/digests/${id}`));
  }
  triggerDigest(body: { userId: string; type: 'daily' | 'weekly' }) {
    return this.http.post<AdminDigest>(this.url('/admin/digests/trigger'), body);
  }
  resendDigest(id: string) {
    return this.http.post(this.url(`/admin/digests/${id}/resend`), {});
  }
  queueSummary() {
    return this.http.get<QueueSummary[]>(this.url('/admin/jobs/summary'));
  }
  jobs(q: Record<string, unknown>) {
    return this.http.get<JobPage>(this.url('/admin/jobs'), { params: this.params(q) });
  }
  job(queue: string, id: string) {
    return this.http.get<AdminJob>(
      this.url(`/admin/jobs/${encodeURIComponent(queue)}/${encodeURIComponent(id)}`),
    );
  }
  cancelJob(queue: string, id: string) {
    return this.http.delete(
      this.url(`/admin/jobs/${encodeURIComponent(queue)}/${encodeURIComponent(id)}`),
    );
  }
  admins(q: Record<string, unknown>) {
    return this.http.get<AdministratorPage>(this.url('/admin/admins'), {
      params: this.params(q),
    });
  }
  createAdmin(body: unknown) {
    return this.http.post<Administrator>(this.url('/admin/admins'), body);
  }
  changePassword(body: unknown) {
    return this.http.patch(this.url('/admin/auth/password'), body);
  }
}
