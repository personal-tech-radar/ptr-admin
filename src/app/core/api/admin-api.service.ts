import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { APP_CONFIG } from '../config/app-config';

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
export interface Health {
  appName: string;
  environment: string;
  uptime: number;
}
export interface Article {
  id: string;
  sourceId: string;
  title: string;
  url: string;
  status: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}
export interface Source {
  id: string;
  name: string;
  url: string;
  type: string;
  category: string;
  enabled: boolean;
  status: string;
  consecutiveFailures: number;
  processedArticleCount: number;
  lastError?: string;
  [key: string]: unknown;
}
export interface Candidate {
  id: string;
  normalizedUrl: string;
  domain: string;
  status: string;
  detectedType?: string;
  rejectionCode?: string;
  activatedSourceId?: string;
  createdAt: string;
  updatedAt: string;
}
export interface Taxonomy {
  id: string;
  kind: string;
  name: string;
  aliases: string[];
  createdAt: string;
  updatedAt: string;
}
export interface Stream {
  id: string;
  key: string;
  name: string;
  description?: string;
  sortOrder: number;
  enabled: boolean;
}
export interface Coverage {
  technologyInterestId: string;
  name: string;
  kind: string;
  streamId: string;
  streamKey: string;
  activeSources: number;
  degradedSources: number;
  disabledSources: number;
}
export interface User {
  id: string;
  email: string;
  displayName: string;
  timezone?: string;
  level?: string;
  dailyDigestEnabled: boolean;
  weeklyDigestEnabled: boolean;
  emailVerifiedAt?: string;
  onboardingCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
}
export interface Digest {
  id: string;
  userEmail?: string;
  type: string;
  periodStart: string;
  periodEnd: string;
  subject: string;
  status: string;
  deliveryMode: string;
  createdAt: string;
  items?: unknown[];
  streamPages?: unknown[];
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
  health() {
    return this.http.get<Health>(this.url('/health'));
  }
  articles(q: Record<string, unknown>) {
    return this.http.get<Page<Article>>(this.url('/admin/articles'), { params: this.params(q) });
  }
  article(id: string) {
    return this.http.get<Article>(this.url(`/admin/articles/${id}`));
  }
  retryArticle(id: string) {
    return this.http.post(this.url(`/admin/articles/${id}/retry-analysis`), {});
  }
  deleteArticle(id: string) {
    return this.http.delete(this.url(`/admin/articles/${id}`));
  }
  sources(q: Record<string, unknown>) {
    return this.http.get<Page<Source>>(this.url('/admin/sources'), { params: this.params(q) });
  }
  source(id: string) {
    return this.http.get<Source>(this.url(`/admin/sources/${id}`));
  }
  createSource(body: unknown) {
    return this.http.post<Source>(this.url('/admin/sources'), body);
  }
  updateSource(id: string, body: unknown) {
    return this.http.patch<Source>(this.url(`/admin/sources/${id}`), body);
  }
  sourceAction(
    id: string,
    action: 'activate' | 'disable' | 'retry-validation' | 'retry-ingestion',
  ) {
    return this.http.post(this.url(`/admin/sources/${id}/${action}`), {});
  }
  candidates(q: Record<string, unknown>) {
    return this.http.get<Page<Candidate>>(this.url('/admin/source-candidates'), {
      params: this.params(q),
    });
  }
  candidate(id: string) {
    return this.http.get<Candidate>(this.url(`/admin/source-candidates/${id}`));
  }
  retryCandidate(id: string) {
    return this.http.post(this.url(`/admin/source-candidates/${id}/retry`), {});
  }
  taxonomy(q: Record<string, unknown>) {
    return this.http.get<Page<Taxonomy>>(this.url('/admin/technology-interests'), {
      params: this.params(q),
    });
  }
  updateTaxonomy(id: string, body: unknown) {
    return this.http.patch<Taxonomy>(this.url(`/admin/technology-interests/${id}`), body);
  }
  mergeTaxonomy(body: unknown) {
    return this.http.post(this.url('/admin/technology-interests/merge'), body);
  }
  discoverSources(id: string) {
    return this.http.post(this.url(`/admin/technology-interests/${id}/discover-sources`), {});
  }
  streams() {
    return this.http.get<Stream[]>(this.url('/admin/content-streams'));
  }
  updateStream(id: string, body: unknown) {
    return this.http.patch<Stream>(this.url(`/admin/content-streams/${id}`), body);
  }
  coverage(q: Record<string, unknown>) {
    return this.http.get<Page<Coverage>>(this.url('/admin/source-coverage'), {
      params: this.params(q),
    });
  }
  users(q: Record<string, unknown>) {
    return this.http.get<Page<User>>(this.url('/admin/users'), { params: this.params(q) });
  }
  user(id: string) {
    return this.http.get<User>(this.url(`/admin/users/${id}`));
  }
  deleteUser(id: string) {
    return this.http.delete(this.url(`/admin/users/${id}`));
  }
  digests(q: Record<string, unknown>) {
    return this.http.get<Page<Digest>>(this.url('/admin/digests'), { params: this.params(q) });
  }
  digest(id: string) {
    return this.http.get<Digest>(this.url(`/admin/digests/${id}`));
  }
  triggerDigest(body: unknown) {
    return this.http.post(this.url('/admin/digests/trigger'), body);
  }
  resendDigest(id: string) {
    return this.http.post(this.url(`/admin/digests/${id}/resend`), {});
  }
  failedJobs(q: Record<string, unknown>) {
    return this.http.get<Page<Record<string, unknown>>>(this.url('/admin/jobs/failed'), {
      params: this.params(q),
    });
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
