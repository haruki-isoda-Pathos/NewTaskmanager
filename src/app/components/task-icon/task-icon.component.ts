import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TooltipDirective }from '../../shared/tooltip/tooltip.directive'
import { TaskModalComponent } from '../task-modal/task-modal.component'
import { Task } from '../../models/task.model';
import { TaskNotificationService } from '../../services/task-notification.service';

@Component({
  selector: 'app-task-icon',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    TooltipDirective,
    TaskModalComponent   
  ],
  templateUrl: './task-icon.component.html',
  styleUrls: ['./task-icon.component.css']
})

export class TaskIconComponent {

  constructor(
    private taskNotificationService:TaskNotificationService
  ) {}

  @Input() task!: Task;

  isDragging = false;
  
  @Input() displayIndex!: number;
  
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

  get tooltipText(): string {
    if (this.isDragging) return '';
    let text = 'クリックして編集と削除\nドラッグでタスクのステータス変更';
    if (this.task.pinnedIndex != null) {
      text += '\n※ドラッグされたため相対位置を固定中';
    }
    return text;
  }
  
    onDragStart() {
      this.isDragging = true;
    }
  
    onDragEnd() {
      this.isDragging = false;
    }


  @Input() column!: 'todo' | 'pending' | 'doing' | 'done';


  getColor(): string {

    if (
      this.taskNotificationService
        .isEditingTask(this.task.id)
    ) {
      return 'default';
    }
  

    if (this.column === 'done') {
      return 'default';
    }
  
    const now = Date.now();
    // 期限超過（最優先）
    if (this.task.deadline?.trim()) {
      const due = new Date(this.task.deadline).getTime();
      if (now >= due) {
        return 'red';
      }
    // リマインダー（期限前）
      if (this.task.notifyBefore != null) {
        const remindTime = due - this.task.notifyBefore * 60 * 1000;
        if (now >= remindTime && now < due) {
          return 'orange';
        }
      }
    }
    // アラーム（作成後）
    if (this.task.notifyAfterMinutes != null) {
      const notifyTime =  (this.task.alarmBaseTime ?? this.task.createdAt) + this.task.notifyAfterMinutes * 60 * 1000;
      if (now >= notifyTime) {
        return 'yellow';
      }
    }
    return 'default';
  }

  @Output() taskClick = new EventEmitter<Task>();

  onClickTask() {
    this.taskClick.emit(this.task)
  }
}