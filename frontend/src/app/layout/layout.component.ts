import { Component, Inject, HostListener } from '@angular/core';
import { AuthService } from '../core/Services/auth.service';
import { TaskService } from '../core/Services/task.service';
import { Task } from '../core/models/task.model';
import { Project } from '../core/models/project.model';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NotificationService } from '../core/Services/notification.service';
import { Notification } from '../core/models/notification.model';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  isSidebarVisible: boolean = true;
  currentUserId: string | null = null;
  dueSoonCount: number = 0;
  tasksDueExactlyTwoDays: number = 0;
  tasksDueLessThanTwoDays: number = 0;
  projectsDueWithinWeek: number = 0;
  notificationOpen: boolean = false;
  tasksDueExactlyTwoDaysList: Task[] = [];
  tasksDueLessThanTwoDaysList: Task[] = [];
  projectsDueWithinWeekList: Project[] = [];
  showNotifications: boolean = false;
  currentPageTitle: string = 'Dashboard';
  unreadNotificationCount: number = 0;
  notifications: Notification[] = [];

  constructor(
    @Inject(AuthService) public authService: AuthService,
    private taskService: TaskService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    // Track route changes to update page title
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateCurrentPageTitle();
    });
  }

  ngOnInit(): void {
    const storedId = localStorage.getItem('user_id');

    if (storedId) {
      this.currentUserId = storedId;
      console.log('✅ Loaded currentUserId from localStorage:', this.currentUserId);
    } else {
      console.warn('❌ No user_id in localStorage');
    }

    // Load tasks to compute due-soon notifications
    this.taskService.getAllTasks().subscribe({
      next: (tasks: Task[]) => {
        const { exactlyTwo, lessThanTwo, exactlyTwoList, lessThanTwoList } = this.splitTasksByTwoDays(tasks);
        this.tasksDueExactlyTwoDays = exactlyTwo;
        this.tasksDueLessThanTwoDays = lessThanTwo;
        this.tasksDueExactlyTwoDaysList = exactlyTwoList;
        this.tasksDueLessThanTwoDaysList = lessThanTwoList;
        this.updateTotalBadge();
      },
      error: (err) => {
        console.warn('Failed to load tasks for notifications', err);
        this.tasksDueExactlyTwoDays = 0;
        this.tasksDueLessThanTwoDays = 0;
        this.tasksDueExactlyTwoDaysList = [];
        this.tasksDueLessThanTwoDaysList = [];
        this.updateTotalBadge();
      }
    });

    // Load projects to compute week-deadline notifications
    this.taskService.getProjects().subscribe({
      next: (projects) => {
        const upcoming = (projects || []).filter((p: any) => {
          const status = ((p.status || '') as string).toLowerCase();
          const isIncomplete = !(status === 'done' || status === 'completed' || status === 'complete');
          if (!isIncomplete || !p.deadline) return false;
          const days = this.daysUntil(p.deadline);
          return days >= 0 && days <= 7;
        });
        this.projectsDueWithinWeek = upcoming.length;
        this.projectsDueWithinWeekList = upcoming as Project[];
        this.updateTotalBadge();
      },
      error: (err) => {
        console.warn('Failed to load projects for notifications', err);
        this.projectsDueWithinWeek = 0;
        this.projectsDueWithinWeekList = [];
        this.updateTotalBadge();
      }
    });

    if (this.currentUserId) {
      this.fetchNotifications();
    }
  }

  fetchNotifications() {
    if (!this.currentUserId) return;
    this.notificationService.getNotifications(this.currentUserId).subscribe({
      next: (data) => {
        this.notifications = data;
        this.updateUnreadNotificationCount();
      },
      error: (err) => {
        this.notifications = [];
        this.updateUnreadNotificationCount();
      }
    });
  }

  updateUnreadNotificationCount() {
    this.unreadNotificationCount = this.notifications.filter(n => !n.is_read).length;
  }

  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
    console.log('Sidebar visible:', this.isSidebarVisible);
  }

  get currentUser() {
    return this.authService.currentUserValue;
  }

  logout() {
    this.authService.logout();
    console.log('User logged out');
  }

  // Get current page title for breadcrumb
  getCurrentPageTitle(): string {
    return this.currentPageTitle;
  }

  // Update current page title based on route
  private updateCurrentPageTitle(): void {
    const url = this.router.url;
    if (url.includes('adminDashboard')) {
      this.currentPageTitle = 'Admin Dashboard';
    } else if (url.includes('employees')) {
      this.currentPageTitle = 'Employee Management';
    } else if (url.includes('projects')) {
      this.currentPageTitle = 'Project Management';
    } else if (url.includes('tasks')) {
      this.currentPageTitle = 'Task Management';
    } else if (url.includes('timelog')) {
      this.currentPageTitle = 'Time Tracking';
    } else if (url.includes('document')) {
      this.currentPageTitle = 'Document Management';
    } else {
      this.currentPageTitle = 'Dashboard';
    }
  }

  // User profile methods
  openUserProfile(): void {
    // TODO: Implement user profile modal/page
    console.log('Opening user profile...');
  }

  openSettings(): void {
    // TODO: Implement settings modal/page
    console.log('Opening settings...');
  }

  // Quick action methods
  createNewProject(): void {
    this.router.navigate(['/dashboard/projects']);
    // TODO: Implement project creation modal/form
    console.log('Creating new project...');
  }

  createNewTask(): void {
    this.router.navigate(['/dashboard/tasks']);
    // TODO: Implement task creation modal/form
    console.log('Creating new task...');
  }

  private splitTasksByTwoDays(tasks: Task[]): { exactlyTwo: number; lessThanTwo: number; exactlyTwoList: Task[]; lessThanTwoList: Task[] } {
    let exactlyTwo = 0;
    let lessThanTwo = 0;
    const exactlyTwoList: Task[] = [];
    const lessThanTwoList: Task[] = [];
    for (const t of tasks) {
      if (!t || !t.due_date) continue;
      const status = (t.status || '').toLowerCase();
      const isIncomplete = !(status === 'done' || status === 'completed' || status === 'complete');
      if (!isIncomplete) continue;
      const days = this.daysUntil(t.due_date);
      if (days === 2) {
        exactlyTwo += 1;
        exactlyTwoList.push(t);
      } else if (days >= 0 && days < 2) {
        lessThanTwo += 1;
        lessThanTwoList.push(t);
      }
    }
    return { exactlyTwo, lessThanTwo, exactlyTwoList, lessThanTwoList };
  }

  private daysUntil(dateLike: string | Date): number {
    const now = new Date();
    const due = new Date(dateLike);
    const msPerDay = 24 * 60 * 60 * 1000;
    // Use ceil to treat partial days as a full day remaining
    return Math.ceil((due.getTime() - now.getTime()) / msPerDay);
  }

  formatDue(dateLike?: string): string {
    if (!dateLike) return '';
    const days = this.daysUntil(dateLike);
    if (days < 0) return `overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
    if (days === 0) return 'due today';
    if (days === 1) return 'in 1 day';
    return `in ${days} days`;
  }

  private updateTotalBadge(): void {
    this.dueSoonCount = this.tasksDueExactlyTwoDays + this.tasksDueLessThanTwoDays + this.projectsDueWithinWeek;
  }

  toggleNotifications(event: MouseEvent) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      // Optionally, mark all as read here and update the backend
      // this.markAllNotificationsAsRead();
    }
  }

  @HostListener('document:click')
  closeNotificationsOnOutsideClick() {
    this.showNotifications = false;
  }
}
