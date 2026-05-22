import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipDirective } from '../../shared/tooltip/tooltip.directive';
import { TaskModalComponent } from '../task-modal/task-modal.component';
import { Task } from '../../models/task.model';
import { TaskNotificationService } from '../../services/task-notification.service';

@Component({
  selector: 'app-task-icon',
  standalone: true,
  imports: [CommonModule, TooltipDirective, TaskModalComponent],
  templateUrl: './task-icon.component.html',
  styleUrls: ['./task-icon.component.css'],
})
export class TaskIconComponent {
  constructor(private taskNotificationService: TaskNotificationService) {}

  @Input() task!: Task;

  @Input() column!: 'todo' | 'pending' | 'doing' | 'done';

  readonly tooltipText = 'クリックして編集と削除\nドラッグしてステータス変更';

  get priorityLabel(): string {
    switch (this.task.priority) {
      case 3:
        return '高';
      case 2:
        return '中';
      case 1:
        return '低';
      default:
        return '-';
    }
  }

  getColor(): string {
    if (this.taskNotificationService.isEditingTask(this.task.id)) {
      return 'default';
    }

    if (this.column === 'done') {
      return 'default';
    }

    const now = Date.now();
    if (this.task.deadline?.trim()) {
      const due = new Date(this.task.deadline).getTime();
      if (now >= due) {
        return 'red';
      }
      if (this.task.notifyBefore != null) {
        const remindTime = due - this.task.notifyBefore * 60 * 1000;
        if (now >= remindTime && now < due) {
          return 'orange';
        }
      }
    }
    if (this.task.notifyAfterMinutes != null) {
      const notifyTime =
        (this.task.alarmBaseTime ?? this.task.createdAt) +
        this.task.notifyAfterMinutes * 60 * 1000;
      if (now >= notifyTime) {
        return 'yellow';
      }
    }
    return 'default';
  }

  @Output() taskClick = new EventEmitter<Task>();

  onClickTask() {
    this.taskClick.emit(this.task);
  }
}
