// export interface TimeLog {
//   id?: number;
//   user_id: number;
//   task_id: number;
//   date: string;
//   hours: number;
//   description?: string;
//   created_at?: string;
// }

export interface TimeLog {
  user_id: number;
  task_id: number;
  date: string;
  hours: number;
  description: string;
}
