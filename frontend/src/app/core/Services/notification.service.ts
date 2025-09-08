// notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notification } from '../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiUrl = 'http://localhost:80/api/notifications';

  constructor(private http: HttpClient) {}

getNotifications(userId: string): Observable<Notification[]> {
  return this.http.get<Notification[]>(`${this.apiUrl}/${userId}`);
}

}
