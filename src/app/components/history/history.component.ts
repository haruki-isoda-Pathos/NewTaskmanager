import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HistoryService, History } from '../../services/history.service';
import { HistoryFilterComponent } from './history-filter/history-filter.component'
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-history',
  standalone: true,
  imports:[CommonModule, HistoryFilterComponent],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})

export class HistoryComponent implements OnInit{

histories: History[] = [];
filteredHistories: History[] = [];
currentFilter: string | null = null;
showClearConfirm: boolean = false;

constructor(
  private historyService: HistoryService,
  private cdr: ChangeDetectorRef
){}

ngOnInit() {
      this.historyService.histories$.subscribe(histories => {
        this.histories = histories;
        this.cdr.detectChanges()
        this.applyFilter();
      });
}

onFilterChanged(action: string | null) {
  this.currentFilter = action;
  this.applyFilter();
}

applyFilter() {
  if (!this.currentFilter) {
    this.filteredHistories = this.histories;
    return;
  }
  this.filteredHistories =
    this.histories.filter(
      history => history.action === this.currentFilter
    );
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
