export type AdminPeriod = '24h' | '7d' | '30d';

export interface PeriodBounds {
  value: AdminPeriod;
  from: string;
  to: string;
  dauFrom: string;
  wauFrom: string;
  mauFrom: string;
  semantics: string;
}

export interface LifecycleCounts {
  active: number;
  degraded: number;
  disabled: number;
}
export interface ArticleCounts {
  total: number;
  new: number;
  duplicate: number;
  pending_analysis: number;
  analyzed: number;
  rejected: number;
  failed: number;
  skipped: number;
}
export interface CandidateCounts {
  total: number;
  pending: number;
  active: number;
  rejected: number;
}
export interface DigestCounts {
  total: number;
  sent: number;
  failed: number;
  draft: number;
  skipped_empty: number;
}
export interface SignalCounts {
  opened: number;
  saved: number;
  useful: number;
  notUseful: number;
  total: number;
}

export interface UserPopularityItem {
  id: string;
  name: string;
  selectedUsers: number;
  activeUsers: number;
  opens: number;
  saves: number;
  usefulFeedback: number;
  notUsefulFeedback: number;
}

export interface UserAnalytics {
  period: PeriodBounds;
  registered: number;
  verified: number;
  onboardingCompleted: number;
  registrations: number;
  verifications: number;
  onboardingCompletions: number;
  dau: number;
  wau: number;
  mau: number;
  activeUsers: number;
  opens: number;
  saves: number;
  usefulFeedback: number;
  notUsefulFeedback: number;
  popularity: {
    semantics: string;
    technologies: UserPopularityItem[];
    interests: UserPopularityItem[];
    streams: UserPopularityItem[];
    sources: UserPopularityItem[];
  };
}

export interface DashboardOverview {
  period: PeriodBounds;
  users: UserAnalytics;
  content: {
    sourcesCreated: number;
    totalSources: number;
    sourceLifecycle: LifecycleCounts;
    receivedArticles: number;
    totalArticles: number;
    pendingAnalysis: number;
    analyzed: number;
    failed: number;
    articlesPeriod: ArticleCounts;
    articlesAllTime: ArticleCounts;
    sourceCandidates: CandidateCounts;
    sourceCandidatesPeriod: CandidateCounts;
  };
  sourceTypes: {
    group: 'feeds' | 'web' | 'github_release';
    types: string[];
    total: number;
    created: number;
    lifecycle: LifecycleCounts;
    receivedArticles: number;
    totalArticles: number;
    signals: SignalCounts;
  }[];
  digests: { period: DigestCounts; allTime: DigestCounts };
  backend: {
    appName: string;
    environment: string;
    status: string;
    uptime: number;
    lastSuccessfulUpdateAt: string | null;
  };
}
