import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ErrorComponent } from './error/error.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { RoleAssignmentComponent } from './components/role-assignment/role-assignment.component';
import { RoleGuard } from './role.guard';
import { AuthGuard } from './auth.guard';
import { ProjectManagementComponent } from './components/project-management/project-management.component';
import { TaskManagementComponent } from './components/task-management/task-management.component';
import { EmployeeManagementComponent } from './components/employee-management/employee-management.component';
import { TimeLogManagementComponent } from './components/time-log-management/time-log-management.component';
import { DocumentManagementComponent } from './components/document-management/document-management.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'adminDashboard', component: AdminDashboardComponent },
      { path: 'employees', component: EmployeeManagementComponent },
      { path: 'projects', component: ProjectManagementComponent },
      { path: 'tasks', component: TaskManagementComponent },
      {
        path: 'roles',
        component: RoleAssignmentComponent,
        canActivate: [RoleGuard],
        data: { role: 'admin' }
      },
      {path: 'timelog', component: TimeLogManagementComponent},
      {path: 'document', component: DocumentManagementComponent},
      { path: '', redirectTo: 'adminDashboard', pathMatch: 'full' }
    ]
  },
  { path: '404', component: ErrorComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/404' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
