import type { Page } from './admin-api.service';

export interface ArticleReference {
  id: string;
  name: string;
}

export interface AdminArticle {
  id: string;
  sourceId: string;
  title: string;
  url: string;
  urlHash: string;
  author: string | null;
  publishedAt: string | null;
  summaryFromFeed: string | null;
  status: 'new' | 'duplicate' | 'pending_analysis' | 'analyzed' | 'rejected' | 'failed' | 'skipped';
  createdAt: string;
  updatedAt: string;
  source: ArticleReference | null;
  contentExtractionMethod: string | null;
  contentFetchedAt: string | null;
  primaryStream: ArticleReference | null;
  qualityScore: number | null;
  finalScore: number | null;
}

export interface ArticleAnalysis {
  preScreenIsRelevant: boolean | null;
  preScreenReason: string | null;
  shortSummary: string | null;
  longSummary: string | null;
  whyItMatters: string | null;
  practicalValue: string | null;
  preScreenAt: string | null;
  fullAnalysisAt: string | null;
  relevanceScore: number | null;
  qualityScore: number | null;
  finalScore: number | null;
  urgencyScore: number | null;
  shouldIncludeInDailyDigest: boolean;
  shouldIncludeInWeeklyDigest: boolean;
  evergreen: boolean;
  breakingChanges: boolean;
  tags: string[] | null;
  complexityLevel: string | null;
  materialType: string | null;
  releaseData: Record<string, unknown> | null;
  securityData: Record<string, unknown> | null;
}

export interface ArticleDetail extends AdminArticle {
  rawContent: string | null;
  contentExtractionConfig: Record<string, unknown> | null;
  analysis: ArticleAnalysis | null;
  technologies: ArticleReference[];
  interests: ArticleReference[];
  streams: ArticleReference[];
}

export type ArticlePage = Page<AdminArticle>;
