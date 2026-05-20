export interface Task {
  id: string;
  title: string;
  memo: string;
  deadline?: string;
  notifyAfterMinutes: number | null;
  notifyBefore?: number | null;
  priority: number;
  displayIndex?: number;
  /** @deprecated 使用しない。旧データ互換のため残置 */
  manualOrder?: number;
  /** ドラッグで固定したカラム内の表示インデックス（0始まり・絶対位置） */
  pinnedIndex?: number;
  createdAt: number;
  alarmBaseTime?: number
  notified?: boolean;
  deadlineNotified?: boolean;
  reminded?: boolean;
  alertState?: 'deadline' | 'notify' | 'remind' | null;
}

