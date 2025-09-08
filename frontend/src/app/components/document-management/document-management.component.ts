import { Component, OnInit } from '@angular/core';
import { DocumentService } from '../../core/Services/document.service';
import { ToastrService } from 'ngx-toastr';
import { Document } from '../../core/models/document.model';
import { Project } from '../../core/models/project.model';
import { HttpEventType } from '@angular/common/http';
// import { HttpEvent, HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-document-management',
  templateUrl: './document-management.component.html',
  styleUrls: ['./document-management.component.css']
})
export class DocumentManagementComponent implements OnInit {
  selectedFile: File | null = null;
  uploading = false;
  uploadProgress = 0;

  projects: Project[] = [];
  project_id: number | null = null;
  documents: Document[] = [];

  currentPage = 1;
  showForm = false;
  filter = {
      project_id: '',
      assigned_to: '',
      status: ''
    };
  // type = ['pdf', 'png', 'jpg', 'jpeg'];

  constructor(
    private documentService: DocumentService,
    private toastr: ToastrService
  ) {}

onFileSelected(event: any): void {
  const file = event.target.files[0];
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpg', 'image/jpeg'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    return;
  }

  if (file.size > maxSize) {
    this.toastr.warning('File size exceeds 5MB limit.', 'Warning', {
      toastClass: 'toast-warning',
      positionClass: 'toast-center-center'
    });
    event.target.value = '';  // Reset file input
    return;
  }

  if (!allowedTypes.includes(file.type)) {
    this.toastr.warning('Invalid file type. Only PDF, PNG, JPG, JPEG allowed.', 'Warning', {
      toastClass: 'toast-warning',
      positionClass: 'toast-center-center'
    });
    event.target.value = '';  // Reset file input
    return;
  }
this.selectedFile = event.target.files[0];
}

  ngOnInit(): void {
    this.loadProjects();
    this.loadDocuments();
  }

  toggleForm() {
  this.showForm = !this.showForm;
}

  loadProjects() {
    this.documentService.getProjects().subscribe({
      next: data => this.projects = data,
      error: err => console.error('Error loading projects', err)
    });
  }

  getProjectName(id: number): string {
    const proj = this.projects.find(p => p.id === id);
    return proj ? proj.name : 'Unknown';
  }

 onUpload() {
        if (!this.project_id) {
    this.toastr.warning('Please select a project.', 'Warning', {
      toastClass: 'toast-warning',
      positionClass: 'toast-center-center',
    });
    return;
  }

  if (!this.selectedFile) {
    this.toastr.warning('Please select a valid file.', 'Warning', {
      toastClass: 'toast-warning',
      positionClass: 'toast-center-center',
    });
    return;
  }

    this.uploading = true;
    this.uploadProgress = 0;

    this.documentService.uploadDocument(this.project_id, this.selectedFile).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round((100 * event.loaded) / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.uploading = false;
          this.selectedFile = null;
          this.toastr.success('Upload successfully!', 'Success', {
        toastClass: 'toast-success',
        positionClass: 'toast-center-center',
      });
          this.loadDocuments(); // Reload documents after upload
        }
      },
      error: (err) => {
        this.uploading = false;
        console.error('Upload failed', err);
          this.toastr.error('Failed to upload document', err, {
        toastClass: 'toast-error',
        positionClass: 'toast-center-center',
  }
);

      },
    });
  }

loadDocuments() {
//     if (this.project_id) {
//       this.documentService.getDocumentsByProject(this.project_id).subscribe({
//         next: (data) => {
//           console.log('Documents loaded:', data);
//           this.documents = data;
//         },
//         error: (err) => {
//           console.error('Error loading documents', err);
//           this.toastr.error('Failed to load documents', 'Error', {
//         toastClass: 'toast-error',
//         positionClass: 'toast-center-center',
//       });
//      },
//   });
//  } else {
      // If no project_id, load all documents
      this.documentService.listDocuments().subscribe({
        next: (data) => {
          console.log('All documents loaded:', data);
          this.documents = data;
        },
        error: (err) => {
          console.error('Error loading all documents', err);
          this.toastr.error('Failed to load all documents', err.message, {
            toastClass:'toast-error',
             positionClass: 'toast-center-center'
          });
        },
      });
    // }
  }

  onDownload(id: number) {
    this.documentService.downloadDocument(id).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `document_${id}`;
        a.click();
        window.URL.revokeObjectURL(url);
          this.toastr.success('Download successfully!', 'Success', {
        toastClass: 'toast-success',
        positionClass: 'toast-center-center',
      });
      },
      error: (err) => {
        console.error('Error loading all documents', err);
          this.toastr.error('Failed to load all documents', err, {
            toastClass:'toast-error',
             positionClass: 'toast-center-center'
          });
        }
    });
  }

  onDelete(id: number) {
    if (!confirm('Are you sure you want to delete this document?')) return;

    this.documentService.deleteDocument(id).subscribe({
      next: (message) => {
    console.log('Delete success:', message);
    this.toastr.success('Document deleted successfully','Success',{
      toastClass:'toast-success',
      positionClass: 'toast-center-center'
    });
    this.loadDocuments();
  },
  error: (err) => {
    console.error('Delete failed', err);
    this.toastr.error('Failed to delete document', 'Error',{
      toastClass:'toast-error',
      positionClass: 'toast-center-center'
    });
  }
    });
  }

    applyFilters(): void {
      this.documentService.listDocuments().subscribe({
        next: (data: Document[]) => {
          this.documents = data.filter(log => {
            const matchesProject = !this.filter.project_id || log.project_id === +this.filter.project_id;
            return matchesProject;
          });
        },
        error: (err) => {
          console.error('Filter fetch error:', err);
        }
      });
    }
    clearFilters(): void {
      this.filter = {
        project_id: '',
        assigned_to: '',
        status: ''
      };
      this.applyFilters();
    }
}
