import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Task } from '../models/task.model';

export interface Board {
  todo: Task[];
  pending: Task[];
  doing: Task[];
  done: Task[];
}

@Injectable({ providedIn: 'root' })
export class TaskService {

  private board: Board = this.loadBoard()

  private subject = new BehaviorSubject<Board>(this.board);
  board$ = this.subject.asObservable();

  persistBoard() {
    localStorage.setItem(
      'board',
      JSON.stringify(this.board)
    );
  }

  addTask(task: Task) {
    this.board.todo.push(task);
    this.subject.next(this.board);
    this.saveBoard()
  }

  updateBoard(board: Board) {
    this.board = board;
    this.subject.next(this.board);
    this.saveBoard()
  }

  updateTask(updatedTask: Task) {
    const newBoard: Board = {
      todo: this.board.todo.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      ),
      pending: this.board.pending.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      ),
      doing: this.board.doing.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      ),
      done: this.board.done.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      )
    };
    this.board = newBoard;
    this.subject.next(this.board);
    this.saveBoard()
  }

  deleteTask(taskId: string) {
    const newBoard: Board = {
      todo: this.board.todo.filter(task =>
        task.id !== taskId
      ),
      pending: this.board.pending.filter(task =>
        task.id !== taskId
      ),
      doing: this.board.doing.filter(task =>
        task.id !== taskId
      ),
      done: this.board.done.filter(task =>
        task.id !== taskId
      )
    };
    this.board = newBoard;
    this.subject.next(this.board);
    this.saveBoard()
  }
  
  private loadBoard(): Board {
    const saved =
      localStorage.getItem('board');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      todo: [],
      pending: [],
      doing: [],
      done: []
    };
  }

  private saveBoard() {
    localStorage.setItem(
      'board',
      JSON.stringify(this.board)
    );
  }


}