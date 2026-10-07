import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly messages = signal<ToastMessage[]>([]);
  private nextId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  success(text: string) {
    const id = ++this.nextId;
    this.messages.update((messages) => [...messages, { id, text }]);
    this.timers.set(
      id,
      setTimeout(() => this.dismiss(id), 5000),
    );
  }

  dismiss(id: number) {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
    this.messages.update((messages) => messages.filter((message) => message.id !== id));
  }
}
