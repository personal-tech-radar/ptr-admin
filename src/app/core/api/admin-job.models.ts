import type { Page } from './admin-api.service';

export type QueueName =
  | 'feed-fetch'
  | 'article-analysis'
  | 'digest'
  | 'web-source-browser-fetch'
  | 'taxonomy-source-discovery';
export type JobState =
  | 'waiting'
  | 'active'
  | 'delayed'
  | 'paused'
  | 'prioritized'
  | 'failed'
  | 'completed'
  | 'unknown'
  | 'waiting-children';
export interface QueueSummary {
  queue: QueueName;
  waiting: number;
  active: number;
  delayed: number;
  paused: number;
  prioritized: number;
  failed: number;
}
export interface JobReference {
  type: 'source' | 'article' | 'candidate' | 'taxonomy' | 'digest' | 'user';
  id: string;
}
export interface AdminJob {
  queue: QueueName;
  id: string;
  type: string;
  name: string;
  state: JobState;
  timestamp: number;
  processedOn: number | null;
  finishedOn: number | null;
  attemptsMade: number;
  attempts: number;
  failedReason: string | null;
  reference: JobReference | null;
}
export type JobPage = Page<AdminJob>;
export const cancellableStates: JobState[] = ['waiting', 'delayed', 'paused', 'prioritized'];
export function jobReferencePath(reference: JobReference | null): string | null {
  if (!reference) return null;
  switch (reference.type) {
    case 'source':
      return `/sources/${reference.id}`;
    case 'article':
      return `/articles/${reference.id}`;
    case 'candidate':
      return `/sources/candidates/${reference.id}`;
    case 'taxonomy':
      return `/taxonomy/${reference.id}`;
    case 'digest':
      return `/digests/${reference.id}`;
    case 'user':
      return `/users/${reference.id}`;
  }
}
