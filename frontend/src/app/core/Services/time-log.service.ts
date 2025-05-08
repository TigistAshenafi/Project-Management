import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TimeLog } from '../models/timeLog.model';

@Injectable({
providedIn: 'root'
})
export class TimeLogService {
private apiUrl = 'http://localhost:8081/time-logs'; // Adjust port and path to match Vert.x backend

constructor(private http: HttpClient) {}

// Create a new time log
createTimeLog(log: TimeLog): Observable<any> {
return this.http.post(`${this.apiUrl}`, log);
}

// Get time logs for a specific task
getLogsByTask(taskId: number): Observable<TimeLog[]> {
return this.http.get<TimeLog[]>(`${this.apiUrl}/${taskId}`);
}

// (Optional) Get all logs by employee
getLogsByUser(userId: number): Observable<TimeLog[]> {
return this.http.get<TimeLog[]>(`${this.apiUrl}?userId=${userId}`);
}
}
