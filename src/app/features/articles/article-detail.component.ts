import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { AdminApiService } from '../../core/api/admin-api.service';
import { ArticleDetail } from '../../core/api/admin-article.models';
import { apiError } from '../../core/api/api-error';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-article-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleDetailComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toasts = inject(ToastService);
  private readonly extractedContentDialog =
    viewChild<ElementRef<HTMLDialogElement>>('extractedContentDialog');
  readonly article = signal<ArticleDetail | null>(null);
  readonly plainContent = computed(() => plainTextFromHtml(this.article()?.rawContent ?? null));
  readonly extractionConfiguration = computed(() =>
    structuredDataEntries(this.article()?.contentExtractionConfig ?? null),
  );
  readonly releaseData = computed(() =>
    structuredDataEntries(this.article()?.analysis?.releaseData ?? null),
  );
  readonly securityData = computed(() =>
    structuredDataEntries(this.article()?.analysis?.securityData ?? null),
  );
  readonly loading = signal(true);
  readonly actionPending = signal(false);
  readonly error = signal('');

  openExtractedContent() {
    this.extractedContentDialog()?.nativeElement.showModal();
  }

  closeExtractedContent() {
    this.extractedContentDialog()?.nativeElement.close();
  }

  constructor() {
    this.load();
  }

  private load() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading.set(true);
    this.api
      .article(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (article) => {
          this.article.set(article);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(apiError(error, 'Article could not be loaded.'));
          this.loading.set(false);
        },
      });
  }

  retry() {
    const item = this.article();
    if (item?.status !== 'failed' || this.actionPending()) return;
    this.actionPending.set(true);
    this.error.set('');
    this.api
      .retryArticle(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.actionPending.set(false);
          this.toasts.success('Analysis retry queued.');
          this.load();
        },
        error: (error: unknown) => {
          this.actionPending.set(false);
          this.error.set(apiError(error, 'Analysis retry failed.'));
        },
      });
  }

  delete() {
    const item = this.article();
    if (!item || this.actionPending()) return;
    if (!this.document.defaultView?.confirm(`Soft-delete “${item.title}”?`)) return;
    this.actionPending.set(true);
    this.api
      .deleteArticle(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigate(['/articles']),
        error: (error: unknown) => {
          this.actionPending.set(false);
          this.error.set(apiError(error, 'Article could not be deleted.'));
        },
      });
  }
}

export interface ArticleDetailField {
  label: string;
  value: string;
}

const htmlEntities: Record<string, string> = {
  amp: '&',
  apos: "'",
  copy: '©',
  hellip: '…',
  laquo: '«',
  ldquo: '“',
  lsquo: '‘',
  mdash: '—',
  nbsp: ' ',
  ndash: '–',
  quot: '"',
  raquo: '»',
  rdquo: '”',
  rsquo: '’',
};

export function plainTextFromHtml(content: string | null): string {
  if (!content) return 'No extracted content.';

  return content
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
      const key = name.toLowerCase();
      if (key.startsWith('#x') || key.startsWith('#')) {
        const codePoint = key.startsWith('#x')
          ? Number.parseInt(key.slice(2), 16)
          : Number.parseInt(key.slice(1), 10);
        return Number.isInteger(codePoint) && codePoint > 0 && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : entity;
      }
      return htmlEntities[key] ?? entity;
    })
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<(?:br|\/?(?:p|div|li|h[1-6]|article|section|blockquote|tr))\b[^>]*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function structuredDataEntries(data: Record<string, unknown> | null): ArticleDetailField[] {
  if (!data) return [];
  const fields: ArticleDetailField[] = [];
  const appendValue = (label: string, value: unknown) => {
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        if (value.length === 0) fields.push({ label, value: '—' });
        else if (value.some((entry) => entry !== null && typeof entry === 'object')) {
          value.forEach((entry, index) => appendValue(`${label} ${index + 1}`, entry));
        } else {
          fields.push({ label, value: value.map(displayValue).join(', ') });
        }
      } else {
        const entries = Object.entries(value as Record<string, unknown>);
        if (entries.length === 0) fields.push({ label, value: '—' });
        else
          entries.forEach(([key, nested]) => appendValue(`${label} / ${humanizeKey(key)}`, nested));
      }
      return;
    }
    fields.push({ label, value: displayValue(value) });
  };

  Object.entries(data).forEach(([key, value]) => appendValue(humanizeKey(key), value));
  return fields;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  return '—';
}

function humanizeKey(key: string): string {
  const words = key.replace(/([a-z\d])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
