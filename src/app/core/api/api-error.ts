import { HttpErrorResponse } from '@angular/common/http';

export function apiError(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse && error.error && typeof error.error === 'object') {
    const message = (error.error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message))
      return message.filter((item): item is string => typeof item === 'string').join(', ');
  }
  return fallback;
}
