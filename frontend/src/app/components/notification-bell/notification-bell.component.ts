import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NotificationService } from '../../core/Services/notification.service';
import { Notification } from '../../core/models/notification.model';

@Component({
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css']
})
export class NotificationBellComponent implements OnChanges {
@Input() userId!: string;
  notifications: Notification[] = [];
  loading = true;

  constructor(private notificationService: NotificationService) {}

  ngOnChanges(changes: SimpleChanges): void {
    console.log('ngOnChanges triggered with changes:', changes);

    if (changes['userId']) {
      console.log('userId changed:', changes['userId'].currentValue);

      if (this.userId) {
        this.fetchNotifications();
      } else {
        console.warn('userId is falsy:', this.userId);
      }
    }
  }

  private fetchNotifications(): void {
    console.log('Fetching notifications for userId:', this.userId);

    this.notificationService.getNotifications(this.userId).subscribe({
      next: (data) => {
        this.notifications = data;
        this.loading = false;
        console.log('✅ Notifications loaded:', data);
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Failed to load notifications:', err);
      }
    });
  }
}
