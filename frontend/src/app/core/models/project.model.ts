export interface Project {
  id: number;
  name: string;
  status: 'not started' | 'in progress' | 'completed' | 'on hold';
  description: string;
   deadline?: string;
}
