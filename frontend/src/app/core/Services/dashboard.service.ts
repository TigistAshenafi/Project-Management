import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.ApiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getDashboardData(startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();

    if (startDate && endDate) {
      params = params.set('startDate', startDate).set('endDate', endDate);
    }

    return this.http.get<any>(this.apiUrl, { params });
  }
}
