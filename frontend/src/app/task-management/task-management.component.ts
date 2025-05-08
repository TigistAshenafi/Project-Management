import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskService } from '../core/Services/task.service';
import { Task } from 'src/app/core/models/task.model';
import { ToastrService } from 'ngx-toastr';
import { Employee } from '../core/models/employee.model';
import { Project } from '../core/models/project.model';

@Component({
  selector: 'app-task-management',
  templateUrl: './task-management.component.html',
  styleUrls: ['./task-management.component.css']
})
export class TaskManagementComponent implements OnInit {
  taskForm!: FormGroup;
  tasks: Task[] = [];
  employees: Employee[] = [];
  projects: Project[] = [];
  editingTaskId: number | null = null;
  showForm = false;
  statuses = ['To Do', 'In Progress', 'Done'];

  constructor(private fb: FormBuilder,
     private taskService: TaskService,
      private toastr: ToastrService,
) {}

  ngOnInit() {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['To Do', Validators.required],
      projectId: ['', Validators.required],
      employeeId: ['', Validators.required],
      dueDate: ['', Validators.required],
    });
    this.loadTask();
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.resetForm();
    }
  }
  onAddClick(): void {
    this.editingTaskId = null;
    this.taskForm.reset();
    this.showForm = true;
  }

  onSubmit(): void {
    if (this.taskForm.invalid)
      return console.log('your data is not appropraite.');
      ;

    if (this.editingTaskId !== null) {
      this.updateTask();
    } else {
      this.addTasks();
    }
  }

  onEdit(task: Task) {
    if (this.editingTaskId === task.id && this.showForm) {
      this.onCancelEdit();
    } else {
    this.taskForm.patchValue(task);
    this.editingTaskId = task.id ?? null;
    this.showForm = true;
  }
}

onCancelEdit(): void {
  this.editingTaskId = null;
  this.taskForm.reset();
  this.showForm = false;
}

addTasks(): void {
  const taskData = {
    ...this.taskForm.value,
    projectId: Number(this.taskForm.value.projectId) || null,
    employeeId: Number(this.taskForm.value.employeeId) || null,
  };

  this.taskService.createTask(taskData).subscribe({
    next: (e) => {
      console.log('Task added:', taskData);
      this.toastr.success('Task added successfully!', 'Success', {
        toastClass: 'toast-success',
        positionClass: 'toast-center-center',
      });
      this.showForm = false;
      this.loadTask(); // Ensure change detection
      this.taskForm.reset();
    },
    error: (err) => {
      this.toastr.error('Failed to add task!', 'Error', {
        toastClass: 'toast-error',
        positionClass: 'toast-center-center',
      });
      console.log(err);
    },
  });
}

  updateTask(): void {
    if(this.editingTaskId === null) return;

    const updatedData = { id: this.editingTaskId, ...this.taskForm.value};
    this.taskService.updateTask(this.editingTaskId,updatedData).subscribe({
    next: (e) => {
      console.log('Task updated:', e);
      this.toastr.success('Task updated successfully!', 'Updated', {
        toastClass: 'toast-success',
        positionClass: 'toast-center-center',
      });
      this.loadTask();
      this.taskForm.reset();
      this.editingTaskId=null;
      this.showForm = false;
    },
    error: (err) => {
      this.toastr.error('Failed to update task!', 'Error', {
        toastClass: 'toast-error',
        positionClass: 'toast-center-center',
      });
      console.log(err);
    }
  });
  }

  onDelete(id: number) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(id).subscribe({
        next: (e) => {
          console.log('Task deleted:', e);
          this.tasks = this.tasks.filter(task => task.id !== id);
          this.toastr.success('Task deleted successfully!', 'Deleted', {
            toastClass: 'toast-success',
            positionClass: 'toast-center-center',
          });
        },
        error: (err) => {
          this.toastr.error('Failed to delete task!', 'Error', {
            toastClass: 'toast-error',
            positionClass: 'toast-center-center',
          });
          console.error(err);
        }
      });
    }
  }

  loadTask(): void {
    this.taskService.getAllTasks().subscribe({
      next: (data) => {
        this.tasks = data;
      },
      error: (err) => {
        console.error('Failed to load tasks:', err);
      }
    });
    // this.taskService.getAllTasks().subscribe(t => this.tasks = t);
    this.taskService.getEmployees().subscribe(e => this.employees = e);
    this.taskService.getProjects().subscribe(p => this.projects = p);
  }


  getEmployeeName(id: number): string {
    const emp = this.employees.find(e => e.id === id);
    return emp ? emp.name : 'Unknown';
  }

  getProjectName(id: number): string {
    const proj = this.projects.find(p => p.id === id);
    return proj ? proj.name : 'Unknown';
  }

  resetForm() {
    this.taskForm.reset({ status: 'To Do' });
    this.editingTaskId = null;
  }
}

