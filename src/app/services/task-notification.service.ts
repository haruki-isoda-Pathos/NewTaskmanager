import { Injectable } from '@angular/core';
import { interval } from 'rxjs';
import { TaskService, Board } from './task.service';
import { HistoryService } from './history.service';
import { NotificationService } from './notification.service';
import { BrowserNotificationService } from './browser-notification.service';

@Injectable({ providedIn: 'root' })
export class TaskNotificationService {
  private board: Board | null = null;
  private isDragging = false;
  private editingTaskId: string | null = null;

  constructor(
    private taskService: TaskService,
    private historyService: HistoryService,
    private notificationService: NotificationService,
    private browserNotificationService: BrowserNotificationService
  ) {
    this.browserNotificationService.requestPermission();
    this.taskService.board$.subscribe((board) => {
      this.board = board;
    });
    interval(1000).subscribe(() => this.checkNotifications());
  }

  setDragging(dragging: boolean) {
    this.isDragging = dragging;
  }

  setEditingTask(taskId: string | null) {
    this.editingTaskId = taskId 
  }

  isEditingTask(taskId: string): boolean {
    return this.editingTaskId === taskId;
  }

  checkNotifications() {
    if (this.isDragging || !this.board) return;

    const now = Date.now();
    let updated = false;

    Object.values(this.board)
      .flat()
      .forEach((task) => {
        if (this.board!.done.includes(task)) return;

         if (task.id === this.editingTaskId) return;

        const due = task.deadline ? new Date(task.deadline).getTime() : null;

        if (task.notifyAfterMinutes != null && !task.notified) {
          const notifyTime =
            (task.alarmBaseTime ?? task.createdAt) +
            task.notifyAfterMinutes * 60 * 1000;

          if (now >= notifyTime) {
            this.notificationService.notify(
              'アラームが反応しているタスクがあります'
            );
            this.browserNotificationService.show(
              'アラーム',
              `${task.title} を確認してください`
            );
            task.notified = true;
            task.alertState = 'notify';

            const columnTasks = Object.values(this.board!)
            .find(column => column.includes(task));
            if (columnTasks) {
              this.taskService.promoteTask(task, columnTasks);
            } 

            updated = true;

            this.historyService.addHistory({
              taskId: task.id,
              taskTitle: task.title,
              action: 'alarm',
              detail: 'アラーム',
              createdAt: new Date(),
            });
          }
        }

        if (due != null && now >= due && !task.deadlineNotified) {
          this.notificationService.notify('期限を超過したタスクがあります');
          this.browserNotificationService.show(
            '期限超過',
            `${task.title} の期限です`
          );
          task.deadlineNotified = true;
          task.alertState = 'deadline';

          const columnTasks = Object.values(this.board!)
            .find(column => column.includes(task));
            if (columnTasks) {
              this.taskService.promoteTask(task, columnTasks);
            } 

          updated = true;

          this.historyService.addHistory({
            taskId: task.id,
            taskTitle: task.title,
            action: 'deadline',
            detail: 'タスク期限到来',
            createdAt: new Date(),
          });
        }

        if (due != null && task.notifyBefore != null && !task.reminded) {
          const remindTime = due - task.notifyBefore * 60 * 1000;

          if (now >= remindTime && now < due) {
            this.notificationService.notify(
              'リマインドされたタスクがあります'
            );
            this.browserNotificationService.show(
              'リマインド',
              `${task.title} を確認してください`
            );
            task.reminded = true;
            task.alertState = 'remind';

            const columnTasks = Object.values(this.board!)
            .find(column => column.includes(task));
            if (columnTasks) {
              this.taskService.promoteTask(task, columnTasks);
            } 

            updated = true;

            this.historyService.addHistory({
              taskId: task.id,
              taskTitle: task.title,
              action: 'remind',
              detail: 'リマインド',
              createdAt: new Date(),
            });
          }
        }
      });

    if (updated) {
      this.taskService.persistBoard();
      this.taskService.updateBoard(this.board);
    }
  }
}
