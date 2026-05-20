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

/** 期限・優先度・作成順（アラート・ピン留めは見ない） */
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

function compareAlerts(a: Task, b: Task): number {
  const pa = getAlertPriority(a)!;
  const pb = getAlertPriority(b)!;
  if (pa !== pb) {
    return pa - pb;
  }
  return compareTasksByRules(a, b);
}

/** 旧データの manualOrder を破棄（全件ピン扱いになっていたため） */
export function clearLegacyManualOrder(task: Task): void {
  delete task.manualOrder;
}

/**
 * カラム内ソート:
 * 1. 発動タスク（期限 > リマインド > アラーム）
 * 2. 非発動: ピン留め位置を維持しつつ、空き枠をルール順で埋める
 */
export function sortColumnTasks(
  tasks: Task[],
  options?: { applyPins?: boolean }
): Task[] {
  const applyPins = options?.applyPins !== false;
  const copy = tasks.map((t) => {
    clearLegacyManualOrder(t);
    return t;
  });

  if (copy.length <= 1) {
    return copy;
  }

  const alerts = copy.filter((t) => t.alertState).sort(compareAlerts);
  const alertCount = alerts.length;
  const alertIds = new Set(alerts.map((t) => t.id));

  const nonAlerts = copy.filter((t) => !alertIds.has(t.id));

  if (!applyPins) {
    return [...alerts, ...nonAlerts.sort(compareTasksByRules)];
  }

  const pinned = nonAlerts.filter((t) => t.pinnedIndex != null);
  const unpinned = nonAlerts
    .filter((t) => t.pinnedIndex == null)
    .sort(compareTasksByRules);

  const middle = mergeUnpinnedWithPins(unpinned, pinned, alertCount);
  return [...alerts, ...middle];
}

function mergeUnpinnedWithPins(
  unpinned: Task[],
  pinned: Task[],
  alertCount: number
): Task[] {
  const middleLen = unpinned.length + pinned.length;
  if (middleLen === 0) {
    return [];
  }

  const slots: (Task | null)[] = Array(middleLen).fill(null);

  const sortedPinned = [...pinned].sort((a, b) => {
    const ia = a.pinnedIndex ?? 0;
    const ib = b.pinnedIndex ?? 0;
    if (ia !== ib) {
      return ia - ib;
    }
    return a.createdAt - b.createdAt;
  });

  for (const task of sortedPinned) {
    let rel = (task.pinnedIndex ?? alertCount) - alertCount;
    rel = Math.max(0, Math.min(rel, middleLen - 1));
    while (rel < middleLen && slots[rel] !== null) {
      rel++;
    }
    if (rel < middleLen) {
      slots[rel] = task;
    } else {
      const empty = slots.findIndex((s) => s === null);
      if (empty >= 0) {
        slots[empty] = task;
      }
    }
  }

  let u = 0;
  for (let i = 0; i < middleLen; i++) {
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

/** @deprecated sortColumnTasks を使用 */
export function compareTasks(a: Task, b: Task): number {
  const aAlert = getAlertPriority(a);
  const bAlert = getAlertPriority(b);
  if (aAlert != null && bAlert != null) {
    return aAlert - bAlert || compareTasksByRules(a, b);
  }
  if (aAlert != null) return -1;
  if (bAlert != null) return 1;
  return compareTasksByRules(a, b);
}
