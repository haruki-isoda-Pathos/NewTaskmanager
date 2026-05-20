import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { Task } from '../models/task.model';

import {
  normalizeTaskForOrder,
  sortColumnTasks,
} from '../utils/task-sort.util';



export type ColumnKey = 'todo' | 'pending' | 'doing' | 'done';



export interface Board {

  todo: Task[];

  pending: Task[];

  doing: Task[];

  done: Task[];

}



@Injectable({ providedIn: 'root' })

export class TaskService {



  private board: Board = this.loadBoard();



  private subject = new BehaviorSubject<Board>(this.board);

  board$ = this.subject.asObservable();



  persistBoard() {

    localStorage.setItem(

      'board',

      JSON.stringify(this.board)

    );

  }



  resortBoard(board: Board): Board {

    return {

      todo: sortColumnTasks(board.todo),

      pending: sortColumnTasks(board.pending),

      doing: sortColumnTasks(board.doing),

      done: sortColumnTasks(board.done, { applyPins: false }),

    };

  }



  private resortAndEmit(): void {

    this.board = this.resortBoard(this.board);

    this.subject.next(this.board);

    this.saveBoard();

  }



  addTask(task: Task) {

    this.board.todo.push(normalizeTaskForOrder(task));

    this.resortAndEmit();

  }



  updateBoard(board: Board) {

    this.board = this.resortBoard(board);

    this.subject.next(this.board);

    this.saveBoard();

  }



  updateTask(updatedTask: Task) {

    const normalized = normalizeTaskForOrder(updatedTask);

    const newBoard: Board = {

      todo: this.board.todo.map((task) =>

        task.id === normalized.id ? normalized : task

      ),

      pending: this.board.pending.map((task) =>

        task.id === normalized.id ? normalized : task

      ),

      doing: this.board.doing.map((task) =>

        task.id === normalized.id ? normalized : task

      ),

      done: this.board.done.map((task) =>

        task.id === normalized.id ? normalized : task

      ),

    };

    this.board = newBoard;

    this.resortAndEmit();

  }



  deleteTask(taskId: string) {

    const newBoard: Board = {

      todo: this.board.todo.filter((task) => task.id !== taskId),

      pending: this.board.pending.filter((task) => task.id !== taskId),

      doing: this.board.doing.filter((task) => task.id !== taskId),

      done: this.board.done.filter((task) => task.id !== taskId),

    };

    this.board = newBoard;

    this.resortAndEmit();

  }



  /** 同一カラム内ドラッグ: ドラッグしたタスクだけピン留めして再ソート */

  setPinnedIndex(taskId: string, column: ColumnKey, index: number): void {

    const task = this.board[column].find((t) => t.id === taskId);

    if (!task) {

      return;

    }

    task.pinnedIndex = index;

    this.resortAndEmit();

  }



  /** カラム間移動（ピンは解除し、移動先カラムでルールソート） */

  moveTaskBetweenColumns(
    taskId: string,
    from: ColumnKey,
    to: ColumnKey
  ): Task | null {
    const task = this.board[from].find((t) => t.id === taskId);
    if (!task) {
      return null;
    }

    this.board[from] = this.board[from].filter((t) => t.id !== taskId);
    this.board[to].push(task);

    delete task.pinnedIndex;
    if (to === 'done') {
      task.alertState = null;
    }

    this.resortAndEmit();
    return task;
  }



  /** 通知・アラート状態変化後に全カラムを再ソート */

  refreshOrder(): void {

    this.resortAndEmit();

  }



  private loadBoard(): Board {

    const saved = localStorage.getItem('board');

    const board: Board = saved

      ? JSON.parse(saved)

      : { todo: [], pending: [], doing: [], done: [] };

    return this.resortBoard(board);

  }



  private saveBoard() {

    localStorage.setItem('board', JSON.stringify(this.board));

  }



  clearDoneTasks() {

    this.board = {

      ...this.board,

      done: [],

    };

    this.subject.next(this.board);

    this.saveBoard();

  }

}

