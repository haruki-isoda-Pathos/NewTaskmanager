import { Component } from '@angular/core';
import { MatrixComponent } from './components/matrix/matrix.component';
import { TaskFormComponent } from './components/task-form/task-form.component';
import { NotificationComponent } from './components/notification/notification.component';
import { HistoryComponent } from './components/history/history.component'
import { TaskModalComponent } from './components/task-modal/task-modal.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatrixComponent, 
    TaskFormComponent, 
    NotificationComponent,
    HistoryComponent,
    TaskModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  
}