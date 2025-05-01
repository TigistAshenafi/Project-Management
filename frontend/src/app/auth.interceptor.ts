import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem('token');
    const apiRequest = request.clone({
      // url: `${environment.apiBaseUrl}${request.url}`,
      url: `${request.url}`,
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next.handle(apiRequest);
  }
}
