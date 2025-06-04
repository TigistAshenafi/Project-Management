import { Component, OnInit } from '@angular/core';
import { TimeLogService } from '../core/Services/time-log.service';
import { TimeLog } from '../core/models/timeLog.model';
import { Task } from '../core/models/task.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-time-log-management',
  templateUrl: './time-log-management.component.html',
  styleUrls: ['./time-log-management.component.css']
})
export class TimeLogManagementComponent implements OnInit {

  log: TimeLog = {
    id:  null,
    user_id: 1,
    task_id: 0,
    date: '',
    hours: 0,
    description: ''
  };

  tasks: Task[] = [];
  logs: TimeLog[] = [];
  currentPage: number = 1;
  minDate: string = new Date().toISOString().split('T')[0]; // Today's date

  formVisible: boolean = false;
  isEditMode = false;
  editingLogId: number | null = null;
  editingLog: TimeLog | null = null;
  totalHours: number = 0;

  constructor(private timeLogService: TimeLogService,
              private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

    loadTasks(): void {
    this.timeLogService.getAllLogs().subscribe({
      next: (data) => {
         this.logs = data.map(log => ({
        ...log,
        date: this.formatDate(log.date)
      }));
      },
      error: (err) => {
        console.error('Failed to load tasks:', err);
      }
    });
        this.timeLogService.getAllTask().subscribe(t => this.tasks = t);
    }

  onTaskChange(taskId: number): void {
    this.fetchLogs(taskId);
    this.getSummary(taskId);
  }

submitLog(): void {
  if (!this.log.task_id || !this.log.date || this.log.hours <= 0) {
    alert('Please fill all required fields correctly.');
    return;
  }

  // ✅ Ensure the date is formatted as 'YYYY-MM-DD'
  const dateObj = new Date(this.log.date);
  const formattedDate = dateObj.toISOString().split('T')[0];
  this.log.date = formattedDate;

  if (this.log.id) {
    this.timeLogService.updateTimeLog(this.log.id, this.log).subscribe({
      next: () => {
        this.toastr.success('Task updated successfully!', 'Success', {
          toastClass: 'toast-success',
          positionClass: 'toast-center-center',
        });
        this.fetchLogs(this.log.task_id);
        this.cancelEdit();
      },
      error: (err) => {
        console.error('Error updating time log:', err);
        this.toastr.error('Failed to update time log!', 'Error', {
          toastClass: 'toast-error',
          positionClass: 'toast-center-center',
        });
      },
      complete: () => {
        this.loadTasks();
      }
    });
  } else {
    this.timeLogService.createTimeLog(this.log).subscribe({
      next: () => {
        this.toastr.success('Task added successfully!', 'Success', {
          toastClass: 'toast-success',
          positionClass: 'toast-center-center',
        });
        this.fetchLogs(this.log.task_id);
        this.resetForm();
      },
      error: (err) => {
        this.toastr.error('Failed to add task!', 'Error', {
          toastClass: 'toast-error',
          positionClass: 'toast-center-center',
        });
      },
      complete: () => {
        this.loadTasks();
      }
    });
  }
}

  getTaskTitle(taskId: number): string {
    const task = this.tasks.find(t => t.id === taskId);
    return task ? task.title : 'Unknown Task';
  }

  startEdit(log: TimeLog): void {
    this.editingLogId = log.id!;
    this.log = { ...log,
      date: this.formatDate(log.date)
    };
    this.isEditMode = true;
      this.formVisible = true;
  }

  private formatDate(date: any): string {
    // Ensure the date is parsed and returned in 'YYYY-MM-DD' format
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}/${month}/${day}`;
  }

  fetchLogs(taskId: number): void {
  this.timeLogService.getLogsByTask(taskId).subscribe({
    next: (data) => {
      this.logs = data.map(log => ({
        ...log,
        date: this.formatDate(log.date)
      }));
      this.getSummary(taskId);

    },
    error: (err) => {
      console.error('Error fetching logs:', err);
      this.logs = [];
    }
  });
}

  // Cancel editing
  cancelEdit(): void {
    this.editingLogId = null;
    this.resetForm();
  }

  // Reset form to initial state
  resetForm(): void {
    this.log = {
      id: null,
      user_id: 1, // TODO: replace with real user ID dynamically
      task_id: this.tasks.length > 0 ? this.tasks[0].id : 0,
      date: '',
      hours: 0,
      description: ''
    };
        this.isEditMode = false;
    this.formVisible = false;
  }

  // Delete a log
  deleteLog(id: number): void {
    if (confirm('Are you sure you want to delete this time log?')) {
      this.timeLogService.deleteTimeLog(id).subscribe({
        next: () => {
          this.toastr.success('Task deleted successfully!', 'Success', {
        toastClass: 'toast-success',
        positionClass: 'toast-center-center',
      });
          if (this.log.task_id) {
            this.fetchLogs(this.log.task_id);
             this.loadTasks();
          }
        },
        error: (err) => {
           this.toastr.error('Failed to delete time log!', 'Error', {
             toastClass: 'toast-error',
             positionClass: 'toast-center-center',
           });
        }
      });
    }
  }
getSummary(taskId: number): void {
  this.timeLogService.getTimeSummaryByTask(taskId).subscribe({
    next: (data) => {
      this.totalHours = data.total_hours || 0;
    },
    error: (err) => {
      console.error('Failed to fetch time summary', err);
      this.totalHours = 0;
    }
  });
}
}
