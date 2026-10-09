import { DatePipe, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { AdminInfoPage, EditorJsDocument } from '../../core/api/admin-info-page.models';
import { AdminApiService } from '../../core/api/admin-api.service';
import { apiError } from '../../core/api/api-error';
import { ToastService } from '../../core/toast.service';
import { EditorJsEditorComponent } from './editor-js-editor.component';

const emptyDocument: EditorJsDocument = {
  blocks: [{ type: 'paragraph', data: { text: '' } }],
};

@Component({
  selector: 'app-info-page-editor',
  imports: [DatePipe, FormsModule, RouterLink, EditorJsEditorComponent],
  templateUrl: './info-page-editor.component.html',
  styleUrl: './info-page-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoPageEditorComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly toasts = inject(ToastService);
  private readonly editorComponent = viewChild(EditorJsEditorComponent);

  readonly item = signal<AdminInfoPage | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly actionPending = signal(false);
  readonly editorReady = signal(false);
  readonly error = signal('');
  readonly isNew = this.route.snapshot.paramMap.get('id') === 'new';
  readonly heading = computed(() =>
    this.isNew ? 'Add information page' : 'Edit information page',
  );
  readonly backQueryParams = this.route.snapshot.queryParams;
  title = '';
  isActive = true;
  editorData = emptyDocument;

  constructor() {
    if (this.isNew) {
      this.loading.set(false);
      return;
    }
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) return EMPTY;
          this.loading.set(true);
          this.error.set('');
          return this.api.infoPage(id).pipe(
            catchError((error: unknown) => {
              this.error.set(apiError(error, 'Information page could not be loaded.'));
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((item) => {
        this.item.set(item);
        this.title = item.title;
        this.isActive = item.isActive;
        this.editorData = item.fullText;
        this.editorReady.set(false);
        this.loading.set(false);
      });
  }

  markEditorReady() {
    this.editorReady.set(true);
  }

  async save() {
    const title = this.title.trim();
    if (!title || this.saving() || !this.editorReady()) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const fullText = await this.editorComponent()?.save();
      if (!fullText) throw new Error('The content editor is not ready.');
      const body = { title, fullText, isActive: this.isActive };
      const current = this.item();
      const request = current
        ? this.api.updateInfoPage(current.id, body)
        : this.api.createInfoPage(body);
      request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.saving.set(false);
          this.toasts.success(current ? 'Information page updated.' : 'Information page created.');
          void this.router.navigate(['/info-pages'], { queryParams: this.backQueryParams });
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.error.set(apiError(error, 'Information page could not be saved.'));
        },
      });
    } catch {
      this.saving.set(false);
      this.error.set('The content editor could not save its current contents.');
    }
  }

  setPublished(isActive: boolean) {
    const current = this.item();
    if (!current || this.actionPending() || current.isActive === isActive) return;
    this.actionPending.set(true);
    this.error.set('');
    this.api
      .updateInfoPage(current.id, { isActive })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.item.set(updated);
          this.isActive = updated.isActive;
          this.actionPending.set(false);
          this.toasts.success(
            updated.isActive ? 'Information page published.' : 'Page saved as draft.',
          );
        },
        error: (error: unknown) => {
          this.actionPending.set(false);
          this.error.set(apiError(error, 'Publication status could not be changed.'));
        },
      });
  }

  remove() {
    const current = this.item();
    if (
      !current ||
      this.actionPending() ||
      !this.document.defaultView?.confirm(`Soft-delete the information page “${current.title}”?`)
    ) {
      return;
    }
    this.actionPending.set(true);
    this.error.set('');
    this.api
      .deleteInfoPage(current.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.actionPending.set(false);
          this.toasts.success('Information page deleted.');
          void this.router.navigate(['/info-pages'], { queryParams: this.backQueryParams });
        },
        error: (error: unknown) => {
          this.actionPending.set(false);
          this.error.set(apiError(error, 'Information page could not be deleted.'));
        },
      });
  }
}
