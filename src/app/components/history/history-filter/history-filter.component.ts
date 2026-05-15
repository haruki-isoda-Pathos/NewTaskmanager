import { Component, Output, EventEmitter } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

@Component ({
    selector: 'app-history-filter',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './history-filter.component.html',
    styleUrls:['./history-filter.component.css'],
})

export class HistoryFilterComponent {

filterOption: string | null = null;

@Output() filterChanged = new EventEmitter<string | null>();

onFilterChange() {
    this.filterChanged.emit(this.filterOption);
  }

}