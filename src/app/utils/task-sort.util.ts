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

export function clearLegacyManualOrder(task: Task): Task {
  const t = { ...task };
  delete t.manualOrder;
  delete t.pinnedIndex;
  return t;
}

/** タスク内容に合わせて alertState を同期（編集後の再ソート用） */
export function syncAlertStateForOrder(task: Task, now = Date.now()): Task {
  const t = { ...task };

  if (!t.deadline?.trim()) {
    delete t.deadline;
    t.reminded = false;
    t.deadlineNotified = false;
    if (t.alertState === 'deadline' || t.alertState === 'remind') {
      t.alertState = null;
    }
  }

  const due = t.deadline ? new Date(t.deadline).getTime() : null;

  if (t.alertState === 'deadline') {
    if (due == null || now < due) {
      t.alertState = null;
    }
  }

  if (t.alertState === 'remind') {
    if (due == null || t.notifyBefore == null) {
      t.alertState = null;
    } else {
      const remindTime = due - t.notifyBefore * 60 * 1000;
      if (now < remindTime || now >= due) {
        t.alertState = null;
      }
    }
  }

  if (t.notifyAfterMinutes == null) {
    if (t.alertState === 'notify') {
      t.alertState = null;
    }
    t.notified = false;
  } else if (t.alertState === 'notify') {
    const notifyTime =
      (t.alarmBaseTime ?? t.createdAt) + t.notifyAfterMinutes * 60 * 1000;
    if (now < notifyTime) {
      t.alertState = null;
    }
  }

  return t;
}

export function normalizeTaskForOrder(task: Task): Task {
  const normalized = clearLegacyManualOrder({ ...task });
  return syncAlertStateForOrder(normalized);
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
