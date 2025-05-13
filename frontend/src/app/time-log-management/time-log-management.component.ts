import { Component, OnInit } from '@angular/core';
import { TimeLogService } from '../core/Services/time-log.service';
import { TimeLog } from '../core/models/timeLog.model';
import { Task } from '../core/models/task.model';

@Component({
  selector: 'app-time-log-management',
  templateUrl: './time-log-management.component.html',
  styleUrls: ['./time-log-management.component.css']
})
export class TimeLogManagementComponent implements OnInit {

  log: TimeLog = {
    user_id: 1, // Replace with actual logged-in user's ID
    task_id: 0,
    date: '',
    hours: 0,
    description: ''
  };

  tasks: Task[] = [];
  logs: TimeLog[] = [];
  currentPage = 1;
  minDate: string = new Date().toISOString().split('T')[0]; // Today's date

  constructor(private timeLogService: TimeLogService) {}

  ngOnInit(): void {
    this.loadTask();
  }

    loadTask(): void {
    this.timeLogService.getAllLogs().subscribe({
      next: (data) => {
        this.logs = data;
      },
      error: (err) => {
        console.error('Failed to load tasks:', err);
      }
    });
        this.timeLogService.getAllTask().subscribe(t => this.tasks = t);
    }


  submitLog(): void {
  this.log.task_id = +this.log.task_id; // Coerce to number
  console.log('Submitting log:', this.log);

  if (!this.log.task_id || !this.log.date || this.log.hours <= 0) {
    alert('Please fill all required fields correctly.');
    return;
  }

  this.timeLogService.createTimeLog(this.log).subscribe({
    next: () => {
      this.fetchLogs(this.log.task_id);
      this.log.date = '';
      this.log.hours = 0;
      this.log.description = '';
    },
    error: (err) => {
      console.error('Error logging time:', err);
      alert('Failed to log time.');
    }
  });
}

  fetchLogs(taskId: number): void {
    this.timeLogService.getLogsByTask(taskId).subscribe({
      next: (data) => {
        this.logs = data;
      },
      error: (err) => {
        console.error('Error fetching logs:', err);
        this.logs = [];
      }
    });
  }

  getTaskTitle(taskId: number): string {
    const task = this.tasks.find(t => t.id === taskId);
    return task ? task.title : 'Unknown Task';
  }
}


// import { Component, OnInit } from '@angular/core';
// import { TimeLogService } from '../core/Services/time-log.service';
// import { TimeLog } from '../core/models/timeLog.model';
// import { Task } from '../core/models/task.model';

// @Component({
//   selector: 'app-time-log-management',
//   templateUrl: './time-log-management.component.html',
//   styleUrls: ['./time-log-management.component.css']
// })
// export class TimeLogManagementComponent implements OnInit {
//   log: TimeLog = {
//     user_id: 1,
//     task_id: 0,
//     date: '',
//     hours: 0,
//     description: ''
//   };

//   tasks: Task[] = [];
//   logs: TimeLog[] = [];
//   currentPage = 1;
//   minDate: string = new Date().toISOString().split('T')[0];

//   constructor(private timeLogService: TimeLogService) {}

//   ngOnInit(): void {
//     this.loadTasks();
//   }

//   loadTasks(): void {
//     this.timeLogService.getAllTask().subscribe({
//       next: (tasks) => {
//         this.tasks = tasks;
//         if (tasks.length > 0) {
//           this.log.task_id = tasks[0].id;
//           this.fetchLogs(tasks[0].id);
//         }
//       },
//       error: (err) => console.error('Error loading tasks:', err)
//     });
//   }

//   submitLog(): void {
//     if (!this.log.task_id || !this.log.date || this.log.hours <= 0) {
//       alert('Please fill all required fields.');
//       return;
//     }

//     this.timeLogService.createTimeLog(this.log).subscribe({
//       next: () => {
//         alert('Log saved!');
//         this.fetchLogs(this.log.task_id);
//         this.log.date = '';
//         this.log.hours = 0;
//         this.log.description = '';
//       },
//       error: (err) => {
//         console.error('Error logging time:', err);
//         alert('Failed to log time.');
//       }
//     });
//   }

//   fetchLogs(taskId: number): void {
//     this.timeLogService.getLogsByTask(taskId).subscribe({
//       next: (data) => {
//         this.logs = data;
//       },
//       error: (err) => {
//         console.error('Error fetching logs:', err);
//         this.logs = [];
//       }
//     });
//   }

//   getTaskTitle(taskId: number): string {
//     const task = this.tasks.find(t => t.id === taskId);
//     return task ? task.title : 'Unknown Task';
//   }
// }
