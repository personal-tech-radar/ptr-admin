import type { Page } from './admin-api.service';

export interface CoverageCounts {
  active: number;
  degraded: number;
  disabled: number;
}
export interface RelatedStream {
  id: string;
  key: string;
  name: string;
  coverage: CoverageCounts;
}
export interface TaxonomyItem {
  id: string;
  kind: 'technology' | 'interest';
  name: string;
  aliases: string[];
  relatedStreams: RelatedStream[];
  coverage: CoverageCounts;
  createdAt: string;
  updatedAt: string;
}
export interface CreateTaxonomyResponse {
  created: boolean;
  message: string;
  taxonomy: Pick<TaxonomyItem, 'id' | 'name' | 'kind' | 'aliases' | 'createdAt' | 'updatedAt'>;
}
export type TaxonomyPage = Page<TaxonomyItem>;
