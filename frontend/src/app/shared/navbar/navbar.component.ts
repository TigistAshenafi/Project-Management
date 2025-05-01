import { Component, OnInit, Inject } from '@angular/core';
import { AuthService } from '../../Services/auth.service'

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  constructor(@Inject(AuthService) private authService: AuthService) {}

  logout() {
    this.authService.logout();
  }

  ngOnInit(): void {
  }


}
