export interface Employee {
  id: number;
  name: string;
  email: string;
  position: string;
  job_type: string;
  role: string;
  status: 'pending' | 'active';
  invite_token?: string;
  invited_at?: string;
  activated_at?: string;
  user_id?: number;
}
