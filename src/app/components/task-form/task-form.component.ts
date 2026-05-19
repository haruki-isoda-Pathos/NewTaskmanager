import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'
import { TaskIconComponent } from '../task-icon/task-icon.component';
import { BrowserNotificationService } from '../../services/browser-notification.service'
import { TaskService } from '../../services/task.service';
import { HistoryService } from '../../services/history.service'
import { NotificationService } from '../../services/notification.service'

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [FormsModule, TaskIconComponent],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css']
})

export class TaskFormComponent {

  title: string = ""
  memo: string = ""
  deadline = ''
  notifyAfterMinutes: number | null = null;
  notifyBefore: number | null = null;
  priority = 1
  manualOrder?: number;

   //UI用
   onKeydownLimit(event: KeyboardEvent, max: number) {
    const target = event.target as HTMLTextAreaElement;
    // バックスペース、削除、矢印キー、コピー＆ペースト（Ctrl/Cmd）などの制御キーは常に許可する
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'];
    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }
    // すでに最大文字数に達している場合、それ以上の文字入力を一切無視する
    if (target.value.length >= max) {
      event.preventDefault(); // 入力イベントそのものをキャンセル
    }
  }

  //UI用
  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto'; // 一旦リセット
    textarea.style.height = textarea.scrollHeight + 'px'; // 中身に合わせる
  }

  constructor(
    private taskService: TaskService,
    private notificationService: NotificationService,
    private browserNotificationService: BrowserNotificationService,
    private historyService: HistoryService
  ){}

  addTasks() {
    
    this.browserNotificationService.requestPermission();

    if (!this.title) {
      this.notificationService.notify('タスク名（必須）を入力してください');
      return;
    }
  
    const newTask = {
      id: crypto.randomUUID(),
      title: this.title,
      memo: this.memo,
      deadline: this.deadline,
      notifyAfterMinutes: this.notifyAfterMinutes,
      notifyBefore: this.notifyBefore,
      priority: this.priority,
      createdAt: Date.now(),
      notified: false,
      deadlineNotified: false
    };
    this.taskService.addTask(newTask);
    this.notificationService.notify("タスクを「未着手」に追加しました");
    this.title = ''
    this.memo = ''
    this.deadline = ''
    this.notifyAfterMinutes = null;
    this.notifyBefore = null;
    this.priority = 1

    this.historyService.addHistory({
      taskId: newTask.id,
      taskTitle: newTask.title,
      action: 'create',
      detail: 'タスクを追加',
      createdAt: new Date()
    });
  }
}