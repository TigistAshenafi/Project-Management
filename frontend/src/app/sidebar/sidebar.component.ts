import { Component, OnInit } from '@angular/core';
import { AuthService } from '..//Services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  constructor(private authService: AuthService) {}
  get currentUser() {
    return this.authService.currentUserValue;
  }

  ngOnInit(): void {
  }
}
