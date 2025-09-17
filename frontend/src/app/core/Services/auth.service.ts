import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // private readonly apiUrl = 'http://localhost:8080';
  private currentUserSubject = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.initializeAuthState();
  }

  private initializeAuthState() {
    const token = localStorage.getItem('token');
    if (token && !this.isTokenExpired(token)) {
      this.currentUserSubject.next(this.decodeToken(token));
    }
  }

    getCurrentUserId(): number | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    // If token is JWT, decode payload
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || null;
  }

  login(credentials: { username: string; password: string }) {
    console.log("Sending login request with:", environment.apiBaseUrl+"/api/login");

    return this.http.post(environment.apiBaseUrl+"/api/login", credentials).pipe(
      tap(
        (res: any) => {
          console.log("Login success:", res);
          localStorage.setItem('token', res.token);
          const decodedToken = this.decodeToken(res.token);
          this.currentUserSubject.next(decodedToken);

          // Redirect based on user role
          const role = decodedToken?.role;
          if (role === 'ADMIN') {
            this.router.navigate(['/dashboard/adminDashboard']);
          } else if (role === 'PROJECT_MANAGER') {
            this.router.navigate(['/dashboard/projects']);
          } else if (role === 'EMPLOYEE') {
            this.router.navigate(['/dashboard/tasks']);
          } else {
            // Fallback to dashboard for unknown roles
            this.router.navigate(['/dashboard']);
          }
        },
        (error) => {
          console.error("Login failed:", error);
        }
      )
    ); // Don't forget to subscribe!
  }


  register(user: { username: string; password: string }) {
    return this.http.post(environment.apiBaseUrl+"/api/register", user);
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  get currentUser() {
    return this.currentUserSubject.asObservable();
  }

  get currentUserValue() {
    return this.currentUserSubject.value;
  }

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    return decoded?.exp ? Date.now() >= decoded.exp * 1000 : true;
  }

  getUserRole(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const decoded = this.decodeToken(token);
    return decoded?.role || null;
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'ADMIN';
  }

  isProjectManager(): boolean {
    const role = this.getUserRole();
    return role === 'PROJECT_MANAGER' || role === 'ADMIN';
  }

  isEmployee(): boolean {
    return this.getUserRole() === 'EMPLOYEE';
  }
}
