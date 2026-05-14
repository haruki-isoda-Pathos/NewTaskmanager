import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, transferArrayItem, moveItemInArray  } from '@angular/cdk/drag-drop';
import { interval } from 'rxjs';
import { TaskIconComponent } from '../task-icon/task-icon.component'
import { TaskModalComponent } from '../task-modal/task-modal.component'
import { TaskService, Board } from '../../services/task.service';
import { BrowserNotificationService } from '../../services/browser-notification.service'
import { NotificationService } from '../../services/notification.service'
import { HistoryService } from '../../services/history.service'
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

constructor(
  private taskService: TaskService,
  private notificationService: NotificationService,
  private cdr: ChangeDetectorRef,
  private browserNotificationService: BrowserNotificationService,
  private historyService: HistoryService
) {}

ngOnInit() {
  this.browserNotificationService.requestPermission();
      this.taskService.board$.subscribe(board => {
        this.board = {
          ...board,
          todo: this.getSortedTasks([...board.todo]),
          pending: this.getSortedTasks([...board.pending]),
          doing: this.getSortedTasks([...board.doing]),
          done: this.getSortedTasks([...board.done]),
        };
       });

       interval(1000).subscribe(() => {
        this.cdr.detectChanges(); // 再描画トリガー
        this.checkNotifications();
       });
     }    

getSortedTasks(tasks: Task[]): Task[] {

      const sorted = tasks.sort((a, b) => {    
        // manualOrder優先
        if (a.manualOrder != null && b.manualOrder != null) {
          return a.manualOrder - b.manualOrder;
        }
        if (a.manualOrder != null) return -1;
        if (b.manualOrder != null) return 1;
        // priority優先
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
    
        // deadline取得
        const aHasDeadline = !!a.deadline;
        const bHasDeadline = !!b.deadline;
        // deadlineあり優先
        if (aHasDeadline && !bHasDeadline) {
          return -1;
        }
        if (!aHasDeadline && bHasDeadline) {
          return 1;
        }
        // 両方deadlineあり
        if (aHasDeadline && bHasDeadline) {
    
          const aDue = new Date(a.deadline!).getTime();
          const bDue = new Date(b.deadline!).getTime();
          if (aDue !== bDue) {
            return aDue - bDue;
          }
        }
    
        // 最後は入力順
        return a.createdAt - b.createdAt;
      });
    
      return sorted;
    }
     
onDrop(event: CdkDragDrop<Task[]>) {
      if (event.previousContainer === event.container &&
        event.previousIndex === event.currentIndex
      ) { return; }
      // 同一カラム内だけ確認したい場合
      if (event.previousContainer === event.container) {
        this.pendingDrop = event;
        this.showConfirm = true;
      const movedTask = event.previousContainer.data[event.previousIndex];
      const targetTask = event.container.data[event.currentIndex];
      this.pendingMoveInfo = {
        fromTitle: movedTask.title,
        toTitle: targetTask.title
      };
      } else {
        // カラム移動は即実行でもOK
        this.executeDrop(event);
      }
    }
  
confirmReorder() {
  if(!this.pendingDrop) return;
  this.executeDrop(this.pendingDrop);
  const event = this.pendingDrop;
  event.container.data.forEach((task, index) => {
    task.manualOrder = index;
  });
  this.taskService.updateBoard(this.board);
  this.resetDialog();

}

cancelReorder() {
  this.resetDialog();
}

private resetDialog() {
  this.pendingDrop = null;
  this.showConfirm = false;
}

private executeDrop(event: CdkDragDrop<Task[]>) {
    // 同じカラム内の並び替え
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      event.container.data.forEach((task, index) => {
        task.manualOrder = index;
      });
    } 
    // カラム間移動
    else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      event.container.data.forEach((task, index) => {
        task.manualOrder = index;
      });
    }
    this.taskService.updateBoard(this.board); // 状態を更新

    const columnNames: Record<string, string> = {
      todo: '未着手',
      pending: '保留',
      doing: '進行中',
      done: '完了'
    };

    const movedTask = event.container.data[event.currentIndex];

    this.historyService.addHistory({
      taskId: movedTask.id,
      taskTitle: movedTask.title,
      action: 'status',
      detail: `${columnNames[event.previousContainer.id]}⇒${columnNames[event.container.id]}`,
      createdAt: new Date()
    });
}

trackById(index: number, task: Task) {
  return task.id;
}

checkNotifications() {
  const now = Date.now();

  Object.values(this.board)
    .flat()
    .forEach(task => {
      // done除外
      if (this.board.done.includes(task)) return;
      const due = task.deadline ? new Date(task.deadline).getTime() : null;
      // 通知
      if (task.notifyAfterMinutes != null && !task.notified) {
        const notifyTime =
        (task.alarmBaseTime ?? task.createdAt) + task.notifyAfterMinutes * 60 * 1000;
        
          if (now >= notifyTime) {
          this.notificationService.notify("アラームが反応しているタスクがあります");
          this.browserNotificationService.show(
            'アラーム',
            `${task.title} を確認してください`
          );
          task.notified = true;

          this.historyService.addHistory({
            taskId: task.id,
            taskTitle: task.title,
            action: 'alarm',
            detail: 'アラーム',
            createdAt: new Date()
          });
          
        }
      }
      // 期限
      if (due != null && now >= due && !task.deadlineNotified) {
        this.notificationService.notify("期限を超過したタスクがあります");
        this.browserNotificationService.show(
          '期限超過',
          `${task.title} の期限です`
        );
        task.deadlineNotified = true;

        this.historyService.addHistory({
          taskId: task.id,
          taskTitle: task.title,
          action: 'deadline',
          detail: 'タスク期限到来',
          createdAt: new Date()
        });
      }
      //　リマインド
      if (due != null && task.notifyBefore != null && !task.reminded) {
        const remindTime =
          due - task.notifyBefore * 60 * 1000;
        
          if (now >= remindTime && now < due) {
          this.notificationService.notify("リマインドされたタスクがあります");
          this.browserNotificationService.show(
            'リマインド',
            `${task.title} を確認してください`
          );
          task.reminded = true;

          this.historyService.addHistory({
            taskId: task.id,
            taskTitle: task.title,
            action: 'remind',
            detail: 'リマインド',
            createdAt: new Date()
          });
        }
      }
    });
    this.taskService.persistBoard();
}

openEditModal(task: Task) {
  this.selectedTask = task;
  this.showModal = true;
}

saveTask(updatedTask: Task) {
  this.taskService.updateTask(updatedTask);
  this.closeModal();
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
}

}