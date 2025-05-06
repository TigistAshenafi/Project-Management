import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AuthService } from './core/Services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRole = route.data['role'];
    const userRole = this.authService.currentUserValue?.role;

    if (userRole === expectedRole || userRole === 'admin') {
      return true;
    }
    this.router.navigate(['/dashboard']);
    return false;
  }
}
