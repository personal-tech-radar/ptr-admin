import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { APP_CONFIG } from '../config/app-config';
import { Observable, tap } from 'rxjs';

export interface Administrator {
  id: string;
  email: string;
  lastLoginAt?: string | null;
  createdAt: string;
}
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly config = inject(APP_CONFIG);
  private readonly token = signal<string | null>(localStorage.getItem('ptr-admin-token'));
  readonly isAuthenticated = computed(() => !!this.token());
  readonly currentToken = this.token.asReadonly();
  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${this.config.apiBaseUrl}/admin/auth/login`, { email, password })
      .pipe(
        tap(({ accessToken }) => {
          localStorage.setItem('ptr-admin-token', accessToken);
          this.token.set(accessToken);
        }),
      );
  }
  logout(): Observable<unknown> {
    const request = this.http.post(`${this.config.apiBaseUrl}/admin/auth/logout`, {});
    return request.pipe(tap(() => this.clear()));
  }
  clear() {
    localStorage.removeItem('ptr-admin-token');
    this.token.set(null);
    void this.router.navigateByUrl('/login');
  }
}
