import type { Page } from './admin-api.service';

export interface DigestStreamPage {
  id: string;
  streamId: string;
  streamKey: string;
  streamName: string;
  url: string;
}
export interface AdminDigest {
  id: string;
  userId: string | null;
  userEmail: string | null;
  actualRecipientEmail: string | null;
  type: 'daily' | 'weekly';
  deliveryMode: 'scheduled' | 'admin_preview';
  status: string;
  articleCount: number;
  periodStart: string;
  periodEnd: string;
  subject: string;
  createdAt: string;
  sentAt: string | null;
  streamPages: DigestStreamPage[];
  triggeringAdministratorId: string | null;
}
export interface DigestScoreBreakdown {
  complexityMatch: number;
  interestMatch: number;
  qualityScore: number;
  recencyScore: number;
  sourcePreferenceAdjustment: number;
  technologyMatch: number;
}
export interface DigestItem {
  id: string;
  articleId: string;
  article: { title: string; url: string; status: string };
  position: number;
  shortDescription: string | null;
  descriptionSource: 'stored_body' | 'unavailable';
  scoreBreakdown: DigestScoreBreakdown | null;
}
export interface DigestDetail extends AdminDigest {
  periodKey: string;
  intro: string | null;
  htmlBody: string;
  textBody: string;
  items: DigestItem[];
  statisticsSnapshot: Record<string, unknown> | null;
  buildDebug: Record<string, unknown> | null;
}
export type DigestPage = Page<AdminDigest>;
