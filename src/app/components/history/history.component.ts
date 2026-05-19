import { Component, computed, inject, signal } from '@angular/core';
import { HistoryService } from '../../services/history.service';
import { HistoryFilterComponent } from './history-filter/history-filter.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, HistoryFilterComponent],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
})
export class HistoryComponent {
  private readonly historyService = inject(HistoryService);
  readonly histories = this.historyService.histories;
  private readonly currentFilter = signal<string | null>(null);

  readonly filteredHistories = computed(() => {
    const filter = this.currentFilter();
    const list = this.histories();
    if (!filter) return list;
    return list.filter((history) => history.action === filter);
  });

  showClearConfirm = false;

  onFilterChanged(action: string | null) {
    this.currentFilter.set(action);
  }

  confirm() {
    this.showClearConfirm = true;
  }

  clearHistory() {
    this.historyService.clearHistories();
    this.showClearConfirm = false;
  }

  cancelRemove() {
    this.showClearConfirm = false;
  }
}
