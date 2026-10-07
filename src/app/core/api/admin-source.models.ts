import type { Page } from './admin-api.service';
import type { PeriodBounds, SignalCounts } from './admin-dashboard.models';

export type SourceType = 'rss' | 'atom' | 'web' | 'github_release';
export type SourceCategory =
  | 'backend_architecture_infra'
  | 'engineering_deep_dives'
  | 'node_typescript_nestjs'
  | 'ai_engineering';
export type SourceStatus = 'active' | 'degraded' | 'disabled';

export interface SourceRef {
  id: string;
  name: string;
}
export interface StreamRef {
  id: string;
  key: string;
}
export interface WebRecipe {
  preferredDiscoveryMethod: string | null;
  preferredExtractionMethod: string | null;
  lastValidatedAt: string | null;
  sitemapUrl: string | null;
  entryUrls: string[];
  articleLinkSelector: string | null;
  articleContentSelector: string | null;
  nextPageSelector: string | null;
  allowedPathPatterns: string[];
  excludedPathPatterns: string[];
}

export interface AdminSource {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  category: SourceCategory;
  enabled: boolean;
  status: SourceStatus;
  consecutiveFailures: number;
  lastSuccessfulFetchAt: string | null;
  lastAttemptAt: string | null;
  lastError: string | null;
  processedArticleCount: number;
  associatedTechnologies: SourceRef[];
  associatedInterests: SourceRef[];
  associatedStreams: StreamRef[];
  trustScore: number;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
  webConfig: WebRecipe | null;
  interactionScore: number;
  includedSignalCount: number;
  periodArticleCount: number;
}

export interface SourcePage extends Page<AdminSource> {
  period: PeriodBounds;
}

export interface SourceAttempt {
  id: string;
  streamIds: string[];
  startedAt: string;
  completedAt: string | null;
  succeeded: boolean;
  publicationsProcessed: number;
  error: string | null;
}

export interface SourceDetail extends AdminSource {
  period: PeriodBounds;
  signals: SignalCounts;
  volume: {
    receivedArticles: number;
    totalArticles: number;
    attempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    publicationsProcessed: number;
  };
  recentAttempts: SourceAttempt[];
}

export interface CreateSource {
  name: string;
  url: string;
  type: SourceType;
  category: SourceCategory;
}

export interface SourceCandidate {
  id: string;
  normalizedUrl: string;
  domain: string;
  seedKey: string | null;
  origin: 'user_submission' | 'technology' | 'interest' | 'seed';
  technologyInterestId: string | null;
  technologyInterestName: string | null;
  contentStreamId: string | null;
  contentStreamName: string | null;
  expectedSourceType: SourceType | null;
  proposedName: string | null;
  relevanceReason: string | null;
  status: 'pending' | 'rejected' | 'active';
  detectedType: 'rss' | 'atom' | 'web' | null;
  proposedConfig: Record<string, unknown> | null;
  validationError: string | null;
  rejectionCode: string | null;
  activatedSourceId: string | null;
  lastValidatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
