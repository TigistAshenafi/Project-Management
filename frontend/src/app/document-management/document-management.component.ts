import { Component, OnInit } from '@angular/core';
import { DocumentService } from '../core/Services/document.service';
import { ToastrService } from 'ngx-toastr';
import { Document } from '../core/models/document.model';
import { Project } from '../core/models/project.model';
// import { HttpEvent, HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-document-management',
  templateUrl: './document-management.component.html',
  styleUrls: ['./document-management.component.css']
})
export class DocumentManagementComponent implements OnInit {
  selectedFile!: File;
  documents: Document[] = [];
  projects: Project[] = [];
  projectId!: number;
  uploading: boolean = false;
  uploadProgress: number = 0;
  currentPage = 1;

  constructor(
    private documentService: DocumentService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
    this.loadProjects();
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

 onUpload(): void {
  if (!this.projectId) {
    this.toastr.warning('Please select a project.', 'Warning',{
        toastClass: 'toast-warning',
        positionClass: 'toast-center-center',
    }
    );
    return;
  }
  if (this.selectedFile) {
    this.uploading = true;
    this.documentService.uploadDocument(this.projectId, this.selectedFile).subscribe({
      next: () => {
        this.uploadProgress = 100;
        this.toastr.success('Upload successful!', 'Success',{
            toastClass: 'toast-success',
          positionClass: 'toast-center-center',
        });
        this.uploading = false;
        this.loadDocuments();
      },
      error: (err) => {
        this.uploading = false;
        this.toastr.error(`Upload failed: ${err.error}`, 'Failed',{
            toastClass: 'toast-error',
          positionClass: 'toast-center-center',
        });
      }
    });
  } else {
    this.toastr.warning('Please select a file.', 'Warning',{
        toastClass: 'toast-warning',
          positionClass: 'toast-center-center',
    });
  }
}

    getProjectName(id: number): string {
    const proj = this.projects.find(p => p.id === id);
    return proj ? proj.name : 'Unknown';
  }

  loadProjects(): void {
  this.documentService.getProjects().subscribe({
    next: (res) => {
      this.projects = res;
    },
    error: () => {
      this.toastr.error('Failed to load projects', 'Failed',{
          toastClass: 'toast-error',
          positionClass: 'toast-center-center',
      });
    }
  });
}

 loadDocuments(): void {
  if (!this.projectId) {
    this.toastr.warning('Please select a project first', 'Warning', {
      toastClass: 'toast-warning',
      positionClass: 'toast-center-center'
    });
    return;
  }

  this.documentService.listDocuments(this.projectId).subscribe({
    next: (res) => {
      this.documents = res;
    },
    error: (err) => {
      console.error('Error loading documents:', err);
      this.toastr.error('Failed to load documents', 'Error', {
        toastClass: 'toast-error',
        positionClass: 'toast-center-center'
      });
    }
  });
}

  onDownload(id: number): void {
    this.documentService.downloadDocument(id).subscribe({
      next: (file) => {
        const blob = new Blob([file], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `document_${id}`;
        link.click();
        this.toastr.success('Download started', 'Success', {
          toastClass: 'toast-success',
          positionClass: 'toast-center-center'
        });
      },
      error: () => {
        this.toastr.error('Download failed', 'Failed', {
          toastClass: 'toast-error',
          positionClass: 'toast-center-center'
        });
      }
    });
  }

  onDelete(id: number): void {
    this.documentService.deleteDocument(id).subscribe({
      next: () => {
        this.toastr.success('Document deleted', 'Success', {
          toastClass: 'toast-success',
          positionClass: 'toast-center-center'
        });
        this.loadDocuments();
      },
      error: () => {
        this.toastr.error('Delete failed', 'Failed', {
          toastClass: 'toast-error',
          positionClass: 'toast-center-center'
        });
      }
    });
  }
}
