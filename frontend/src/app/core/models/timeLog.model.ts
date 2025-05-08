export interface TimeLog {
  id?: number;
  user_id: number;
  task_id: number;
  date: string; // format: 'YYYY-MM-DD'
  hours: number; // e.g., 2.5
  description?: string;
  }
