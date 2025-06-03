import { Component, Inject } from '@angular/core';
import { AuthService } from '../core/Services/auth.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  isSidebarVisible: boolean = true;

  constructor(@Inject(AuthService) private authService: AuthService) {}

  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  get currentUser() {
    return this.authService.currentUserValue;
  }

  logout() {
    this.authService.logout();
    console.log('User logged out');
  }
}
