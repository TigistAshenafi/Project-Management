import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskService, Task as TaskModel } from '../Services/task.service';

@Component({
  selector: 'app-task-management',
  templateUrl: './task-management.component.html',
  styleUrls: ['./task-management.component.css']
})

export class TaskManagementComponent implements OnInit {
  taskForm: FormGroup;
  tasks: TaskModel[] = [];
  showForm = false;
  editingTask: TaskModel | null = null;

  constructor(private fb: FormBuilder, private taskService: TaskService) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['To Do']
    });
  }

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe(data => this.tasks = data);
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  onSubmit() {
    if (this.editingTask) {
      this.taskService.updateTask(this.editingTask.id!, this.taskForm.value).subscribe(() => {
        this.loadTasks();
        this.resetForm();
      });
    } else {
      this.taskService.addTask(this.taskForm.value).subscribe(() => {
        this.loadTasks();
        this.resetForm();
      });
    }
  }

  editTask(task: TaskModel) {
    this.taskForm.patchValue(task);
    this.editingTask = task;
    this.showForm = true;
  }

  deleteTask(id: number) {
    this.taskService.deleteTask(id).subscribe(() => this.loadTasks());
  }

  resetForm() {
    this.taskForm.reset({ status: 'To Do' });
    this.showForm = false;
    this.editingTask = null;
  }
}
