import type { Page } from './admin-api.service';

export interface UserSelection {
  id: string;
  name: string;
  kind?: string;
  key?: string;
}
export interface UserActivity {
  active: boolean;
  opens: number;
  saves: number;
  usefulFeedback: number;
  notUsefulFeedback: number;
  total: number;
}
export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  githubUrl: string | null;
  timezone: string | null;
  level: string | null;
  dailyDigestEnabled: boolean;
  weeklyDigestEnabled: boolean;
  emailVerifiedAt: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface AdminUserListItem extends AdminUser {
  periodActivity: UserActivity;
  selectedTechnologies: UserSelection[];
  selectedInterests: UserSelection[];
  selectedStreams: UserSelection[];
}
export interface UserPage extends Page<AdminUserListItem> {
  activityWindow: { from: string; to: string; semantics: string };
}
export interface SourcePreference {
  id: string;
  sourceId: string;
  sourceName: string;
  openedCount: number;
  savedCount: number;
  usefulCount: number;
  notUsefulCount: number;
  feedbackAdjustment: number;
}
export interface UserEvent {
  id: string;
  articleId: string;
  articleTitle?: string;
  article?: { title: string };
  userId: string;
  userEmail: string;
  type?: string;
  firstOpenedAt?: string;
  savedAt?: string;
  updatedAt?: string;
}
