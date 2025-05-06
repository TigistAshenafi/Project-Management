import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskService } from '../core/Services/task.service';
import { Task } from 'src/app/core/models/task.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-task-management',
  templateUrl: './task-management.component.html',
  styleUrls: ['./task-management.component.css']
})
export class TaskManagementComponent implements OnInit {
  taskForm: FormGroup;
  tasks: Task[] = [];
  employees: any[] = [];
  projects: any[] = [];
  editingTask: Task | null = null;
  statuses = ['To Do', 'In Progress', 'Done'];

    addTasks(): void {
      if (this.taskForm.valid) {
        const taskData = this.taskForm.value;
        console.log('Task added:', taskData);
        // Add logic to save the task
      }
    }

  showForm: boolean = false;

  constructor(private fb: FormBuilder,
     private taskService: TaskService,
     private snackBar: MatSnackBar) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['To Do', Validators.required],
      projectId: ['', Validators.required],
      employeeId: ['', Validators.required],
      dueDate: ['', Validators.required],
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.taskService.getTasks().subscribe((tasks) => {
      this.tasks = tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        projectId: task.projectId,
        employeeId: task.employeeId,
        dueDate: task.dueDate
      }));
    });

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


  onSubmit() {
    if (this.taskForm.invalid) return;

    const task: Task = {
      ...this.taskForm.value,
      id: this.editingTask?.id
    };

    if (this.editingTask && task.id != null) {
      this.taskService.updateTask(task.id, task).subscribe(() => {
        this.loadInitialData();
        this.resetForm();
      });
    } else {
      this.taskService.createTask(task).subscribe(() => {
        this.loadInitialData();
        this.resetForm();
      });
    }
  }

  onEdit(task: Task) {
    this.taskForm.patchValue(task);
    this.editingTask = task;
  }

  onDelete(id: number) {
    if (confirm('Delete task?')) {
      this.taskService.deleteTask(id).subscribe(() => this.loadInitialData());
    }
  }

  resetForm() {
    this.taskForm.reset({ status: 'To Do' });
    this.editingTask = null;
  }
}

