import { Directive, HostBinding, HostListener, Input, inject } from '@angular/core';
import { Params, Router } from '@angular/router';

@Directive({
  selector: 'tr[appTableRowLink]',
  standalone: true,
})
export class TableRowLinkDirective {
  private readonly router = inject(Router);
  @Input({ required: true }) appTableRowLink: readonly unknown[] = [];
  @Input() appTableRowQueryParams?: Params;
  @Input() appTableRowLabel = 'Open record details';

  @HostBinding('attr.tabindex') readonly tabindex = 0;
  @HostBinding('attr.aria-label') get ariaLabel() {
    return this.appTableRowLabel;
  }

  @HostListener('click', ['$event'])
  navigateFromClick(event: MouseEvent) {
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest('a, button, input, select, textarea, [contenteditable="true"]')
    ) {
      return;
    }
    this.navigate();
  }

  @HostListener('keydown.enter', ['$event'])
  navigateFromKeyboard(event: Event) {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    this.navigate();
  }

  private navigate() {
    void this.router.navigate(this.appTableRowLink as string[], {
      queryParams: this.appTableRowQueryParams,
    });
  }
}
