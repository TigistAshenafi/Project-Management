import { Component, OnInit } from '@angular/core';
import { ConfirmService } from 'src/app/shared/confirm.service';
import { TimeLogService } from '../../core/Services/time-log.service';
import { TimeLog } from '../../core/models/timeLog.model';
import { Task } from '../../core/models/task.model';
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
  filter = {
  task_id: '',
  Date: '',
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
              private toastr: ToastrService,
              private confirm: ConfirmService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

    loadTasks(): void {
    this.timeLogService.getAllLogs().subscribe({
      next: (data) => {
         this.logs = data.map(log => ({
        ...log,
        // date: this.formatDate(log.date)
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
  }

submitLog(): void {
  if (!this.log.task_id || !this.log.date || this.log.hours <= 0) {
    alert('Please fill all required fields correctly.');
    return;
  }


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
     date: this.normalizeDate(log.date)
    };
    this.isEditMode = true;
      this.formVisible = true;
  }


  fetchLogs(taskId: number): void {
  this.timeLogService.getLogsByTask(taskId).subscribe({
    next: (data) => {
      this.logs = data.map(log => ({
        ...log,
        // date: this.formatDate(log.date)
      }));
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
    this.confirm.confirm('This action cannot be undone. Do you want to delete this item?', 'Delete time log')
      .then((ok) => {
        if (!ok) return;
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
      });
  }
applyFilters(): void {
  this.timeLogService.getAllLogs().subscribe({
    next: (data: TimeLog[]) => {
      this.logs = data.filter(log => {
        const matchesTask = !this.filter.task_id || log.task_id === +this.filter.task_id;

        const logDate = this.normalizeDate(log.date);         // normalize log date
        const filterDate = this.normalizeDate(this.filter.Date); // normalize input date

        const matchesDate = !this.filter.Date || logDate === filterDate;

        return matchesTask && matchesDate;
      });
    },
    error: (err) => {
      console.error('Filter fetch error:', err);
    }
  });
}
normalizeDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return ''; // invalid date guard
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

clearFilters(): void {
  this.filter = {
    task_id: '',
    Date: ''
  };
  this.applyFilters();
}
}
