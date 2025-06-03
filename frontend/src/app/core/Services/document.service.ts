import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType, HttpRequest, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Project } from '../models/project.model';
import { Document } from '../models/document.model';
@Injectable({
  providedIn: 'root'
})
export class DocumentService {

    private baseUrl = `${environment.ApiUrl}/api`;

  constructor(private http: HttpClient) {}

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.baseUrl}/projects`);
  }
  listDocuments(): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.baseUrl}/documents`);
  }

  // getDocumentsByProject(projectId: number): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.baseUrl}/documents/projects/${projectId}`);
  // }

uploadDocument(projectId: number, file: File): Observable<HttpEvent<any>> {
  const formData = new FormData();
  formData.append('file', file);

  return this.http.post<any>(`${this.baseUrl}/documents/projects/${projectId}`,
    formData,
    {
      reportProgress: true,
      observe: 'events'
    }
  );
}
  downloadDocument(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/documents/download/${id}`, {
      responseType: 'blob'
    });
  }

  deleteDocument(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/documents/${id}`);

  }
}
