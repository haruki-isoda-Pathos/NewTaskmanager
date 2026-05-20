import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { interval } from 'rxjs';
import { TaskIconComponent } from '../task-icon/task-icon.component'
import { TaskModalComponent } from '../task-modal/task-modal.component'
import { TaskService, Board, ColumnKey } from '../../services/task.service';
import { NotificationService } from '../../services/notification.service'
import { HistoryService } from '../../services/history.service'
import { TaskNotificationService } from '../../services/task-notification.service'
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-matrix',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskIconComponent, TaskModalComponent],
  templateUrl: './matrix.component.html',
  styleUrls: ['./matrix.component.css']
})

export class MatrixComponent implements OnInit{

  board!: Board;
  pendingDrop: CdkDragDrop<Task[]> | null = null;
  showConfirm = false;
  selectedTask: Task | null = null;
  showModal = false;
  pendingMoveInfo: {
    fromTitle: string;
    toTitle: string;
  } | null = null;
  isDragging: boolean = false;
  showDoneClearConfirm = false;

constructor(
  private taskService: TaskService,
  private notificationService: NotificationService,
  private cdr: ChangeDetectorRef,
  private historyService: HistoryService,
  private taskNotificationService: TaskNotificationService
) {}

ngOnInit() {
      this.taskService.board$.subscribe(board => {
        this.board = board;
       });

       interval(1000).subscribe(() => {
        this.cdr.detectChanges();
       });
     }

setDragging(dragging: boolean) {
  this.isDragging = dragging;
  this.taskNotificationService.setDragging(dragging);
}
     
onDrop(event: CdkDragDrop<Task[]>) {
      if (event.previousContainer === event.container &&
        event.previousIndex === event.currentIndex
      ) { return; }
      // 同一カラム内（完了以外）は確認後にピン留め＋再ソート
      if (event.previousContainer === event.container &&
        event.container.id !== 'done'
      ) {
        this.pendingDrop = event;
        this.showConfirm = true;
      const movedTask = event.previousContainer.data[event.previousIndex];
      const targetTask = event.container.data[event.currentIndex];
      this.pendingMoveInfo = {
        fromTitle: movedTask.title,
        toTitle: targetTask.title
      };
      } else {
        this.executeDrop(event);
      }
    }
  
confirmReorder() {
  if(!this.pendingDrop) return;
  const event = this.pendingDrop;
  const movedTask = event.previousContainer.data[event.previousIndex];
  const column = event.container.id as ColumnKey;
  this.taskService.setPinnedIndex(movedTask.id, column, event.currentIndex);
  this.resetDialog();
}

cancelReorder() {
  this.resetDialog();
}

private resetDialog() {
  this.pendingDrop = null;
  this.showConfirm = false;
  this.pendingMoveInfo = null;
}

private executeDrop(event: CdkDragDrop<Task[]>) {
    const fromCol = event.previousContainer.id as ColumnKey;
    const toCol = event.container.id as ColumnKey;
    const movedTask = event.previousContainer.data[event.previousIndex];

    let resultTask: Task | null;

    if (event.previousContainer === event.container) {
      this.taskService.setPinnedIndex(movedTask.id, toCol, event.currentIndex);
      resultTask = movedTask;
    } else {
      resultTask = this.taskService.moveTaskBetweenColumns(
        movedTask.id,
        fromCol,
        toCol,
        event.currentIndex
      );
    }

    if (!resultTask) {
      return;
    }

    const columnNames: Record<string, string> = {
      todo: '未着手',
      pending: '保留',
      doing: '進行中',
      done: '完了'
    };

    this.historyService.addHistory({
      taskId: resultTask.id,
      taskTitle: resultTask.title,
      action: 'status',
      detail: `${columnNames[fromCol]}⇒${columnNames[toCol]}`,
      createdAt: new Date()
    });
}

trackById(index: number, task: Task) {
  return task.id;
}

openEditModal(task: Task) {
  this.selectedTask = task;
  this.showModal = true;
  this.taskNotificationService.setEditingTask(task.id);
}

saveTask(updatedTask: Task) {
  this.taskService.updateTask(updatedTask);
  this.closeModal();
  this.taskNotificationService.setEditingTask(null);
  this.notificationService.notify("タスクを編集しました");

  this.historyService.addHistory({
    taskId: updatedTask.id,
    taskTitle: updatedTask.title,
    action: 'edit',
    detail: 'タスクを編集',
    createdAt: new Date()
  });
}

removeTask(task: Task) {
  this.taskService.deleteTask(task.id);
  this.closeModal();
  this.taskNotificationService.setEditingTask(null);
  this.notificationService.notify("タスクを削除しました");

  this.historyService.addHistory({
    taskId: task.id,
    taskTitle: task.title,
    action: 'delete',
    detail: 'タスクを削除',
    createdAt: new Date()
  });
}


closeModal() {
  this.showModal = false;
  this.taskNotificationService.setEditingTask(null);
}

confirmDoneClear() {
  this.showDoneClearConfirm = true;
}

cancelDoneClear() {
  this.showDoneClearConfirm = false;
}

clearDoneTasks() {
  const doneTasks = [...this.board.done];
  doneTasks.forEach(task => {
    this.historyService.addHistory({
      taskId: task.id,
      taskTitle: task.title,
      action: 'delete',
      detail: '完了カラム一括削除',
      createdAt: new Date()
    });
  });
  this.taskService.clearDoneTasks();
  this.showDoneClearConfirm = false;
  this.notificationService.notify(
    '完了タスクを削除しました'
  );
}

}
