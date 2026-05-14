import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HistoryService, History } from '../../services/history.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-history',
  standalone: true,
  imports:[CommonModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})

export class HistoryComponent implements OnInit{

histories: History[] = []
showClearConfirm: boolean = false;

constructor(
  private historyService: HistoryService,
  private cdr: ChangeDetectorRef
){}

ngOnInit() {
      this.historyService.histories$.subscribe(histories => {
        this.histories = histories
        this.cdr.detectChanges()
      });
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
