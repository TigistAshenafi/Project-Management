import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
}

@Injectable({ providedIn: 'root' })

export class TaskService {
  private baseUrl = 'http://localhost:8081/api/tasks';

  constructor(private http: HttpClient) {}

  getTasks() {
    return this.http.get<Task[]>(this.baseUrl);
  }

  addTask(task: Task) {
    return this.http.post(this.baseUrl, task);
  }

  updateTask(id: number, task: Task) {
    return this.http.put(`${this.baseUrl}/${id}`, task);
  }

  deleteTask(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
