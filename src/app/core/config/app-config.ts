import { InjectionToken } from '@angular/core';

export interface AppConfig {
  apiBaseUrl: string;
}
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    apiBaseUrl: globalThis.__PTR_ADMIN_CONFIG__?.apiBaseUrl ?? 'http://localhost:3300',
  }),
});

declare global {
  var __PTR_ADMIN_CONFIG__: AppConfig | undefined;
}
