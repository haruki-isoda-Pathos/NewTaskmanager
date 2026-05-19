import { Injectable, signal } from '@angular/core';

export interface History {
  taskId: string;
  taskTitle: string;

  action:
    | 'create'
    | 'edit'
    | 'delete'
    | 'status'
    | 'deadline'
    | 'remind'
    | 'alarm';

  detail: string;

  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly historiesSignal = signal<History[]>(this.loadHistories());
  readonly histories = this.historiesSignal.asReadonly();

  addHistory(history: History) {
    this.historiesSignal.update((list) => [history, ...list]);
    this.saveHistories();
  }

  clearHistories() {
    this.historiesSignal.set([]);
    this.saveHistories();
  }

  private loadHistories(): History[] {
    const saved = localStorage.getItem('histories');
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  }

  private saveHistories() {
    localStorage.setItem(
      'histories',
      JSON.stringify(this.historiesSignal())
    );
  }
}
