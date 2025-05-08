export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done';
  projectId: number;
  employeeId: number;
  dueDate: Date;
}
