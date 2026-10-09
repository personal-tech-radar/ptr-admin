import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type EditorJS from '@editorjs/editorjs';
import type { EditorJsDocument } from '../../core/api/admin-info-page.models';

@Component({
  selector: 'app-editor-js-editor',
  templateUrl: './editor-js-editor.component.html',
  styleUrl: './editor-js-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorJsEditorComponent {
  readonly data = input.required<EditorJsDocument>();
  readonly ready = output<void>();
  readonly error = signal('');
  readonly initialized = signal(false);
  private readonly holder = viewChild.required<ElementRef<HTMLDivElement>>('holder');
  private readonly destroyRef = inject(DestroyRef);
  private editor: EditorJS | null = null;

  constructor() {
    afterNextRender(() => void this.initialize());
    this.destroyRef.onDestroy(() => this.editor?.destroy());
  }

  async save(): Promise<EditorJsDocument> {
    if (!this.editor) throw new Error('The content editor is not ready.');
    return (await this.editor.save()) as EditorJsDocument;
  }

  private async initialize() {
    try {
      const [{ default: Editor }, { default: Header }] = await Promise.all([
        import('@editorjs/editorjs'),
        import('@editorjs/header'),
      ]);
      if (this.destroyRef.destroyed) return;
      this.editor = new Editor({
        holder: this.holder().nativeElement,
        data: this.data(),
        minHeight: 180,
        inlineToolbar: ['link', 'bold', 'italic'],
        tools: {
          header: {
            class: Header,
            inlineToolbar: ['link', 'bold', 'italic'],
            config: { levels: [2, 3, 4, 5, 6], defaultLevel: 2 },
          },
          paragraph: { inlineToolbar: ['link', 'bold', 'italic'] },
        },
        onReady: () => {
          this.initialized.set(true);
          this.ready.emit();
        },
      });
      await this.editor.isReady;
    } catch {
      this.error.set('The content editor could not be loaded. Reload the page and try again.');
    }
  }
}
