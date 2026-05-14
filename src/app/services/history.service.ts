import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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

    private histories: History[] = this.loadHistories();

    private subject = new BehaviorSubject<History[]>(this.histories);
    histories$ = this.subject.asObservable();

    addHistory(history: History) {
        this.histories.unshift(history)
        this.subject.next(this.histories);
        this.saveHistories()
      }

    clearHistories() {
        this.histories = [];
        this.subject.next(this.histories);
        this.saveHistories()
      }

    private loadHistories(): History[] {
        const saved =
          localStorage.getItem('histories');
        if (saved) {
          return JSON.parse(saved);
        }
        return [];
      }

    private saveHistories() {
        localStorage.setItem(
          'histories',
          JSON.stringify(this.histories)
        );
      }
}