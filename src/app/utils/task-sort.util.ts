import { Task } from '../models/task.model';

/** 期限・優先度・作成順による並び（manualOrder は見ない） */
export function compareTasksByRules(a: Task, b: Task): number {
  const aHasDeadline = !!a.deadline;
  const bHasDeadline = !!b.deadline;

  if (aHasDeadline && !bHasDeadline) {
    return -1;
  }

  if (!aHasDeadline && bHasDeadline) {
    return 1;
  }

  if (aHasDeadline && bHasDeadline) {
    const aDue = new Date(a.deadline!).getTime();
    const bDue = new Date(b.deadline!).getTime();

    if (aDue !== bDue) {
      return aDue - bDue;
    }
  }

  if (a.priority !== b.priority) {
    return b.priority - a.priority;
  }

  return a.createdAt - b.createdAt;
}

/** getSortedTasks 用（manualOrder を最優先） */
export function compareTasks(a: Task, b: Task): number {
  if (a.manualOrder != null && b.manualOrder != null) {
    return a.manualOrder - b.manualOrder;
  }

  if (a.manualOrder != null) return -1;
  if (b.manualOrder != null) return 1;

  return compareTasksByRules(a, b);
}
