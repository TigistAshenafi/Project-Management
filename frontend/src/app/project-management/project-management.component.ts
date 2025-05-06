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
    this.projectsService.createProject(projectData).subscribe((e) => {
      console.log('Project created:', e);
      this.showForm = false;
      this.loadProjects();
      this.projectForm.reset();
      this.toastr.success('Project created successfully', 'Created!', {
        toastClass: 'custom-toast',
        closeButton: true,
        timeOut: 3000,
        progressBar: true,
        positionClass: 'toast-top-right'
      });
    });
  }

  updateProject(): void {
    if (this.editingProjectId === null) return;

    const updatedData = { id: this.editingProjectId, ...this.projectForm.value };
    this.projectsService.updateProject(this.editingProjectId, updatedData).subscribe((e) => {
      console.log('Project updated:', e);

      this.loadProjects();
      this.projectForm.reset();
      this.editingProjectId = null;
      this.showForm = false;
      this.toastr.success('Project updated successfully!', 'Updated', {
        toastClass: 'custom-toast',
        closeButton: true,
        timeOut: 3000,
        progressBar: true,
        positionClass: 'toast-top-right'

      });
    });
  }

  onDelete(id: number): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectsService.deleteProject(id).subscribe(() => {
        this.loadProjects();
        this.toastr.info('Project deleted successfully!', 'Deleted', {
          toastClass: 'custom-toast',
          closeButton: true,
          timeOut: 3000,
          progressBar: true,
          positionClass: 'toast-top-right'
        });
      });
    }
  }

  loadProjects(): void {
    this.projectsService.getAllProjects().subscribe(data => {
      this.projects = data;
    });
  }
}
