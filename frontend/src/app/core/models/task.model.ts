export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  project_id: number;
  assigned_to: number;
  due_date: string;
  estimated_hours: number;
}
