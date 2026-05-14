import { Component } from '@angular/core'
import { HistoryComponent } from '../history.component'

@Component ({
    selector: 'app-history-filter',
    standalone: true,
    imports: [HistoryComponent],
    templateUrl: './history-filter.component.html',
    styleUrls:['./history-filter.component.css'],
})

export class HistoryFilterComponent {}