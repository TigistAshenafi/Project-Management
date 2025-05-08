import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RoleAssignmentComponent } from './role-assignment/role-assignment.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ErrorComponent } from './error/error.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { RoleGuard } from './role.guard';
import { AuthGuard } from './auth.guard';
import { AuthService } from './core/Services/auth.service';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ProjectManagementComponent } from './project-management/project-management.component';
import { TaskManagementComponent } from './task-management/task-management.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { EmployeeManagementComponent } from './employee-management/employee-management.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { TimeLogManagementComponent } from './time-log-management/time-log-management.component';
@NgModule({
  declarations: [
    AppComponent,
    RoleAssignmentComponent,
    LoginComponent,
    RegisterComponent,
    SidebarComponent,
    DashboardComponent,
    ErrorComponent,
    ProjectManagementComponent,
    TaskManagementComponent,
    NavbarComponent,
    EmployeeManagementComponent,
    TimeLogManagementComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,ReactiveFormsModule,FormsModule,HttpClientModule,RouterModule, ToastrModule.forRoot({
      positionClass: 'toast-bottom-center',   // Positions: toast-top-left, toast-bottom-right, etc.
      timeOut: 4000,                      // Duration in milliseconds
      progressBar: true,                  // Show a progress bar
      closeButton: true,                  // Show a close (X) button
      tapToDismiss: true,                 // Dismiss on click
      newestOnTop: true
    }),BrowserAnimationsModule,MatSnackBarModule
  ],
  providers: [
    AuthService,
    AuthGuard,
    RoleGuard,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
