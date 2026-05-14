export interface Task {
  id: string;
  title: string;
  memo: string;
  deadline?: string;
  notifyAfterMinutes: number | null;
  notifyBefore?: number | null;
  priority: number;
  displayIndex?: number;
  manualOrder?: number;
  createdAt: number;
  alarmBaseTime?: number
  notified?: boolean;
  deadlineNotified?: boolean;
  reminded?: boolean;
}

