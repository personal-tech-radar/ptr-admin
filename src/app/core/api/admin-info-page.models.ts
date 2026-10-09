import type { Page } from './admin-api.service';

export interface EditorJsHeaderBlock {
  id?: string;
  type: 'header';
  data: { text: string; level: number };
}

export interface EditorJsParagraphBlock {
  id?: string;
  type: 'paragraph';
  data: { text: string };
}

export type EditorJsBlock = EditorJsHeaderBlock | EditorJsParagraphBlock;

/** The shared Editor.js OutputData document used by info pages. */
export interface EditorJsDocument {
  time?: number;
  blocks: EditorJsBlock[];
  version?: string;
}

export interface AdminInfoPageListItem {
  id: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInfoPage extends AdminInfoPageListItem {
  fullText: EditorJsDocument;
}

export type InfoPagePage = Page<AdminInfoPageListItem>;

export interface CreateInfoPage {
  title: string;
  fullText: EditorJsDocument;
  isActive: boolean;
}

export type UpdateInfoPage = Partial<CreateInfoPage>;
