import { Component, OnInit } from '@angular/core';
import { TimeLog } from '../core/models/timeLog.model';
import { TimeLogService } from '../core/Services/time-log.service';

@Component({
selector: 'app-time-log-management',
templateUrl: './time-log-management.component.html',
styleUrls: ['./time-log-management.component.css']
})
export class TimeLogManagementComponent implements OnInit {
log: TimeLog = {
user_id: 1, // Example default; should come from logged-in user or form
task_id: 42, // Set via context (e.g. selected task)
date: '',
hours: 0,
description: ''
};
currentPage = 1;
logs: TimeLog[] = [];

constructor(private timeLogService: TimeLogService) {}

ngOnInit(): void {
this.fetchLogs();
}

submitLog(): void {
if (!this.log.date || this.log.hours <= 0) {
alert('Please enter a valid date and hours.');
return;
}
this.timeLogService.createTimeLog(this.log).subscribe({
  next: () => {
    this.fetchLogs();
    this.resetForm();
  },
  error: () => alert('Error logging time')
});
}

fetchLogs(): void {
this.timeLogService.getLogsByTask(this.log.task_id).subscribe({
next: (data) =>
  this.logs = data,
error: () => alert('Error fetching logs')
});
}

resetForm(): void {
this.log.date = '';
this.log.hours = 0;
this.log.description = '';
}
}
