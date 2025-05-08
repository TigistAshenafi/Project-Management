export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done';
  project_id: number;
  assigned_to: number;
  due_date: Date;
}
