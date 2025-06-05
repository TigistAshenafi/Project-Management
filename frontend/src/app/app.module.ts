import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgChartsModule } from 'ng2-charts';
import { RoleAssignmentComponent } from './role-assignment/role-assignment.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ErrorComponent } from './error/error.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { RoleGuard } from './role.guard';
import { AuthGuard } from './auth.guard';
import { AuthService } from './core/Services/auth.service';
import { HttpClientModule, HttpEventType} from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ProjectManagementComponent } from './project-management/project-management.component';
import { TaskManagementComponent } from './task-management/task-management.component';
import { EmployeeManagementComponent } from './employee-management/employee-management.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { TimeLogManagementComponent } from './time-log-management/time-log-management.component';
import { LayoutComponent } from './layout/layout.component';
import { DocumentManagementComponent } from './document-management/document-management.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
@NgModule({
  declarations: [
    AppComponent,
    RoleAssignmentComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    ErrorComponent,
    ProjectManagementComponent,
    TaskManagementComponent,
    EmployeeManagementComponent,
    TimeLogManagementComponent,
    LayoutComponent,
    DocumentManagementComponent,
    AdminDashboardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,ReactiveFormsModule,FormsModule,HttpClientModule,NgChartsModule,RouterModule, ToastrModule.forRoot({
      positionClass: 'toast-bottom-center',   // Positions: toast-top-left, toast-bottom-right, etc.
      timeOut: 4000,                      // Duration in milliseconds
      progressBar: true,                  // Show a progress bar
      closeButton: true,                  // Show a close (X) button
      tapToDismiss: true,                 // Dismiss on click
      newestOnTop: true
    }),BrowserAnimationsModule,NgxPaginationModule
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
