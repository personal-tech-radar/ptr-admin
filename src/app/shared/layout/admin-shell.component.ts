import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { ToastContainerComponent } from './toast-container.component';

@Component({
  selector: 'app-admin-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ToastContainerComponent],
  templateUrl: './admin-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShellComponent {
  readonly auth = inject(AuthService);
  readonly nav = [
    { path: 'dashboard', label: 'Dashboard', icon: '⌂' },
    { path: 'users', label: 'Users', icon: '♙' },
    { path: 'taxonomy', label: 'Taxonomy', icon: '◇' },
    { path: 'sources', label: 'Sources', icon: '◉' },
    { path: 'articles', label: 'Articles', icon: '▤' },
    { path: 'digests', label: 'Digests', icon: '✉' },
    { path: 'jobs', label: 'Jobs', icon: '⚙' },
    { path: 'admins', label: 'Administrators', icon: '♟' },
  ];
  logout() {
    this.auth.logout().subscribe({ error: () => this.auth.clear() });
  }
}
