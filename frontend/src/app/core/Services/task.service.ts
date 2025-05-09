import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../models/task.model';
import { Employee } from '../models/employee.model';
import { Project } from '../models/project.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private baseUrl = `${environment.ApiUrl}/api`;

  constructor(private http: HttpClient) {}

  getAllTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.baseUrl}/tasks`, this.getAuth());
  }

  createTask(task: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(`${this.baseUrl}/tasks`, task,this.getAuth());
  }

  updateTask(id: number, taskData: any) {
    return this.http.put(this.baseUrl+"/tasks/"+id, taskData, {
      headers: this.getAuth().headers
    });
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tasks/${id}`, this.getAuth());
  }
  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.baseUrl}/employees`);
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.baseUrl}/projects`);
  }

  private getAuth() {
    return {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    };
  }
}

