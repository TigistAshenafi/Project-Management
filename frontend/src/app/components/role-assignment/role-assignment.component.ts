import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/Services/auth.service';

@Component({
  selector: 'app-role-assignment',
  templateUrl: './role-assignment.component.html',
  styleUrls: ['./role-assignment.component.css']
})
export class RoleAssignmentComponent implements OnInit {

  users: any[] = [];

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.http.get<any[]>('http://localhost:8082/api/users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe(users => {
      this.users = users.map(u => ({ ...u, newRole: u.role }));
    });
  }

  updateRole(user: any) {
    this.http.put(`http://localhost:8082/api/users/${user.id}/role`, { role: user.newRole }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe(() => {
      user.role = user.newRole;
    });
  }
}
