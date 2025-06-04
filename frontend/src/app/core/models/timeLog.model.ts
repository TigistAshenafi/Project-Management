export interface TimeLog {
  id: number | null;
  user_id: number;
  task_id: number;
  date: string;
  hours: number;
  description: string;
}
