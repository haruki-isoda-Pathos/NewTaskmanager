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

/** 期限・優先度・作成順（アラート・ピン留めは見ない） */
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

/** 旧データの manualOrder を破棄（全件ピン扱いになっていたため） */
export function clearLegacyManualOrder(task: Task): void {
  delete task.manualOrder;
}

/** 期限なし・無効アラート状態を正規化（保存・ソート前に適用） */
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

/**
 * カラム内ソート:
 * 1. 発動タスク（期限 > リマインド > アラーム）を最上位
 * 2. 各タスクはルール順
 * 3. pinnedIndex はカラム全体の絶対位置（アイコン色・アラート種別をまたぐドラッグ可）
 */
export function sortColumnTasks(
  tasks: Task[],
  options?: { applyPins?: boolean }
): Task[] {
  const applyPins = options?.applyPins !== false;
  const copy = tasks.map((t) => normalizeTaskForOrder(t));

  if (copy.length <= 1) {
    return copy;
  }

  if (!applyPins) {
    return [...copy].sort(compareTasksInColumn);
  }

  const pinned = copy
    .filter((t) => t.pinnedIndex != null)
    .sort((a, b) => {
      const ia = a.pinnedIndex ?? 0;
      const ib = b.pinnedIndex ?? 0;
      if (ia !== ib) {
        return ia - ib;
      }
      return a.createdAt - b.createdAt;
    });

  const unpinned = copy
    .filter((t) => t.pinnedIndex == null)
    .sort(compareTasksInColumn);

  return mergeUnpinnedWithPins(unpinned, pinned, 0);
}

function mergeUnpinnedWithPins(
  unpinned: Task[],
  pinned: Task[],
  groupStartIndex: number
): Task[] {
  const groupLen = unpinned.length + pinned.length;
  if (groupLen === 0) {
    return [];
  }

  const slots: (Task | null)[] = Array(groupLen).fill(null);

  for (const task of pinned) {
    let rel = (task.pinnedIndex ?? groupStartIndex) - groupStartIndex;
    rel = Math.max(0, Math.min(rel, groupLen - 1));
    while (rel < groupLen && slots[rel] !== null) {
      rel++;
    }
    if (rel < groupLen) {
      slots[rel] = task;
    } else {
      const empty = slots.findIndex((s) => s === null);
      if (empty >= 0) {
        slots[empty] = task;
      }
    }
  }

  let u = 0;
  for (let i = 0; i < groupLen; i++) {
    if (slots[i] !== null) {
      continue;
    }
    while (
      u < unpinned.length &&
      slots.some((s) => s?.id === unpinned[u].id)
    ) {
      u++;
    }
    if (u < unpinned.length) {
      slots[i] = unpinned[u++];
    }
  }

  return slots.filter((t): t is Task => t !== null);
}

/** @deprecated compareTasksInColumn を使用 */
export function compareTasks(a: Task, b: Task): number {
  return compareTasksInColumn(a, b);
}
