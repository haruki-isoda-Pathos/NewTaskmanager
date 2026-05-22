import { Task } from '../models/task.model';

/** 発動中アラートの優先度: 期限 > リマインド > アラーム */
const ALERT_PRIORITY: Record<NonNullable<Task['alertState']>, number> = {
  deadline: 0,
  remind: 1,
  notify: 2,
};

export function getAlertPriority(task: Task): number | null {
  if (!task.alertState) {
    return null;
  }
  return ALERT_PRIORITY[task.alertState];
}

function hasDeadline(task: Task): boolean {
  return !!task.deadline?.trim();
}

/** 期限・優先度・作成順 */
export function compareTasksByRules(a: Task, b: Task): number {
  const aHasDeadline = hasDeadline(a);
  const bHasDeadline = hasDeadline(b);

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

/**
 * カラム全体のルール順（発動アラート最上位 → 有期限/無期限ルール）
 */
export function compareTasksInColumn(a: Task, b: Task): number {
  const aAlert = getAlertPriority(a);
  const bAlert = getAlertPriority(b);
  if (aAlert != null && bAlert != null) {
    if (aAlert !== bAlert) {
      return aAlert - bAlert;
    }
    return compareTasksByRules(a, b);
  }
  if (aAlert != null) {
    return -1;
  }
  if (bAlert != null) {
    return 1;
  }
  return compareTasksByRules(a, b);
}

export function clearLegacyManualOrder(task: Task): void {
  delete task.manualOrder;
  delete task.pinnedIndex;
}

export function normalizeTaskForOrder(task: Task): Task {
  const normalized = { ...task };
  clearLegacyManualOrder(normalized);

  if (!normalized.deadline?.trim()) {
    delete normalized.deadline;
    normalized.reminded = false;
    normalized.deadlineNotified = false;
    if (
      normalized.alertState === 'deadline' ||
      normalized.alertState === 'remind'
    ) {
      normalized.alertState = null;
    }
  }

  return normalized;
}

/** カラム内ソート（ルール順のみ） */
export function sortColumnTasks(tasks: Task[]): Task[] {
  const copy = tasks.map((t) => normalizeTaskForOrder(t));

  if (copy.length <= 1) {
    return copy;
  }

  return [...copy].sort(compareTasksInColumn);
}

/** @deprecated compareTasksInColumn を使用 */
export function compareTasks(a: Task, b: Task): number {
  return compareTasksInColumn(a, b);
}
