import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  private apiUrl = environment.employeeApiUrl;

  constructor(private http: HttpClient) {}

  getAllEmployees() {
    return this.http.get(`${this.apiUrl}/employees`);
  }

  createEmployee(employee: any) {
    return this.http.post(`${this.apiUrl}/employees`, employee);
  }

  updateEmployee(id: number, employee: any) {
    return this.http.put(`${this.apiUrl}/employees/${id}`, employee);
  }

  deleteEmployee(id: number) {
    return this.http.delete(`${this.apiUrl}/employees/${id}`);
  }
}
