import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TimeLog } from '../models/timeLog.model';
import { Task } from '../models/task.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TimeLogService {
  private apiUrl = `${environment.ApiUrl}`;

  constructor(private http: HttpClient) {}

  createTimeLog(log: TimeLog): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/time-logs`, log, { responseType: 'json' });
  }

  getAllTask(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/api/tasks`);
  }
  getAllLogs(): Observable<TimeLog[]>{
    return this.http.get<TimeLog[]>(`${this.apiUrl}/api/time-logs`);
  }

  getLogsByTask(taskId: number): Observable<TimeLog[]> {
    // return this.http.get<TimeLog[]>(`${this.apiUrl}/api/time-logs`);
        return this.http.get<TimeLog[]>(`${this.apiUrl}/api/time-logs/${taskId}`);
  }
}
