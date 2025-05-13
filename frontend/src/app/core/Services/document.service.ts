import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Project } from '../models/project.model';


@Injectable({
  providedIn: 'root'
})
export class DocumentService {
    private baseUrl = `${environment.ApiUrl}/api`;

  constructor(private http: HttpClient) {}

  // Upload a document
  uploadDocument(projectId: number, file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post(`${this.baseUrl}/projects/${projectId}/documents`, formData);
  }

  // List documents of a project
  listDocuments(projectId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/projects/${projectId}/documents`);
  }

  // Download document by ID
  downloadDocument(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/documents/${id}`, {
      responseType: 'blob'
    });
  }

  // Delete document by ID
  deleteDocument(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/documents/${id}`);
  }

  getProjects(): Observable<Project[]> {
      return this.http.get<Project[]>(`${this.baseUrl}/projects`);
    }
}
