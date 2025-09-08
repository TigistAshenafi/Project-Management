import { Component, OnInit, Input, Output, EventEmitter, HostListener, OnChanges, SimpleChanges } from '@angular/core';
import { NotificationService } from '../../core/Services/notification.service';
import { Notification } from '../../core/models/notification.model';
import { Task } from '../../core/models/task.model';
import { Project } from '../../core/models/project.model';

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.css'],
})
export class NotificationListComponent implements OnInit, OnChanges {
  @Input() userId!: string;  // pass userId from parent
  @Input() open: boolean = false;
  @Input() tasksDueExactlyTwoDaysList: Task[] = [];
  @Input() tasksDueLessThanTwoDaysList: Task[] = [];
  @Input() projectsDueWithinWeekList: Project[] = [];
  @Output() close = new EventEmitter<void>();
  notifications: Notification[] = [];
  loading = true;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.tryFetch();
  }

  @HostListener('document:click') onDocumentClick() {
    if (this.open) {
      this.close.emit();
    }
  }

  onContainerClick(event: MouseEvent) {
    event.stopPropagation();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const userIdChanged = !!changes['userId'];
    const openChangedToTrue = !!changes['open'] && changes['open'].currentValue === true;
    if ((userIdChanged || openChangedToTrue) && this.userId) {
      this.tryFetch();
    }
  }

  private tryFetch(): void {
    if (!this.userId) { return; }
    this.loading = true;
    this.notificationService.getNotifications(this.userId).subscribe({
      next: (data) => {
        this.notifications = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load notifications', err);
        this.loading = false;
      },
    });
  }
}
