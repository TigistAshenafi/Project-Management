import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectsService } from '../core/Services/projects.service';
import { Project } from '../core/models/project.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-project-management',
  templateUrl: './project-management.component.html',
  styleUrls: ['./project-management.component.css']
})
export class ProjectManagementComponent implements OnInit {
  projectForm!: FormGroup;
  projects: Project[] = [];
  editingProjectId: number | null = null;
  showForm = false;
  currentPage = 1;

  constructor(
    private fb: FormBuilder,
    private projectsService: ProjectsService,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
    this.loadProjects();
  }

  toggleAddForm(): void {
    if (this.editingProjectId) {
      this.onCancelEdit();
    } else {
      this.showForm = !this.showForm;
      if (this.showForm) {
        this.projectForm.reset();
      }
    }
  }

  onAddClick(): void {
    this.editingProjectId = null;
    this.projectForm.reset();
    this.showForm = true;
  }

  onSubmit(): void {
    if (this.projectForm.invalid) return;

    if (this.editingProjectId !== null) {
      this.updateProject();
    } else {
      this.addProjects();
    }
  }

  onEdit(project: Project): void {
    if (this.editingProjectId === project.id && this.showForm) {
      this.onCancelEdit();
    } else {
      this.projectForm.patchValue(project);
      this.editingProjectId = project.id;
      this.showForm = true;
    }
  }

  onCancelEdit(): void {
    this.editingProjectId = null;
    this.projectForm.reset();
    this.showForm = false;
  }

  addProjects(): void {
    const projectData = this.projectForm.value;
    this.projectsService.createProject(projectData).subscribe({
      next: (e: any) => {
        console.log('Project created:', e);

        this.toastr.success('Project added successfully!', 'Success', {
          toastClass: 'toast-success',
          positionClass: 'toast-center-center',
        });
        this.showForm = false;
        this.loadProjects();
        this.projectForm.reset();
      },
      error: (err: any) => {
        this.toastr.error('Failed to add project!', 'Error', {
          toastClass: 'toast-error',
          positionClass: 'toast-center-center',
        });
        console.error(err);
      }
    });
  }


  updateProject(): void {
    if (this.editingProjectId === null) return;

    const updatedData = { id: this.editingProjectId, ...this.projectForm.value };
    this.projectsService.updateProject(this.editingProjectId, updatedData).subscribe({
      next: (e) => {
      console.log('Project updated:', e);
      this.toastr.success('Project updated successfully!', 'Updated', {
        toastClass: 'toast-success',
        positionClass: 'toast-center-center',
      });
      this.loadProjects();
      this.projectForm.reset();
      this.editingProjectId = null;
      this.showForm = false;
      },
      error: (err) => {
        this.toastr.error('Failed to update project', 'Error', {
          toastClass: 'toast-error',
          positionClass: 'toast-center-center',
        });
        console.error(err);
      }
    });
  }

  onDelete(id: number): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectsService.deleteProject(id).subscribe({
        next: (e: any) => {
          console.log('Project deleted:', e);
          this.projects = this.projects.filter(project => project.id !== id);
          this.toastr.success('Project deleted successfully!', 'Deleted', {
            toastClass: 'toast-success',
            positionClass: 'toast-center-center',
          });
        },
        error: (err: any) => {
          this.toastr.error('Failed to delete project', 'Error', {
            toastClass: 'toast-error',
            positionClass: 'toast-center-center',
          });
          console.error(err);
        }
      });
    }
  }

  loadProjects(): void {
    this.projectsService.getAllProjects().subscribe(data => {
      this.projects = data;
    });
  }
}
