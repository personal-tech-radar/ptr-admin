import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { AdminApiService, Administrator } from '../../core/api/admin-api.service';
import { apiError } from '../../core/api/api-error';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-administrators',
  imports: [DatePipe, FormsModule],
  templateUrl: './administrators.component.html',
  styleUrl: './administrators.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministratorsComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toasts = inject(ToastService);
  private readonly createDialog = viewChild<ElementRef<HTMLDialogElement>>('createDialog');
  readonly administrators = signal<Administrator[]>([]);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal('');
  readonly createError = signal('');
  readonly page = signal(1);
  readonly totalPages = signal(1);
  form = { email: '', password: '' };

  constructor() {
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          this.page.set(Math.max(1, Number(params.get('page')) || 1));
          this.loading.set(true);
          this.error.set('');
          return this.api.admins({ page: this.page(), limit: 20 }).pipe(
            catchError((error: unknown) => {
              this.loading.set(false);
              this.error.set(apiError(error, 'Administrators could not be loaded.'));
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.administrators.set(result.items);
        this.totalPages.set(Math.max(1, Math.ceil(result.total / result.limit)));
        this.loading.set(false);
      });
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }
  openCreate() {
    this.createError.set('');
    this.createDialog()?.nativeElement.showModal();
  }
  closeCreate() {
    this.createDialog()?.nativeElement.close();
  }
  create() {
    if (this.pending()) return;
    this.pending.set(true);
    this.createError.set('');
    this.api
      .createAdmin({ ...this.form })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (admin) => {
          this.pending.set(false);
          this.closeCreate();
          this.toasts.success(`Created ${admin.email}.`);
          if (this.page() === 1) {
            this.api
              .admins({ page: 1, limit: 20 })
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (result) => {
                  this.administrators.set(result.items);
                  this.totalPages.set(Math.max(1, Math.ceil(result.total / result.limit)));
                },
                error: (error: unknown) =>
                  this.error.set(apiError(error, 'Administrators could not be refreshed.')),
              });
          } else {
            void this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { page: 1 },
            });
          }
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.createError.set(apiError(error, 'Administrator could not be created.'));
        },
      });
  }
}
