import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ErrorComponent } from './error/error.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { RoleAssignmentComponent } from './role-assignment/role-assignment.component';
import { RoleGuard } from './role.guard';
import { AuthGuard } from './auth.guard';
import { ProjectManagementComponent } from './project-management/project-management.component';
import { TaskManagementComponent } from './task-management/task-management.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { EmployeeManagementComponent } from './employee-management/employee-management.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'employees', component: EmployeeManagementComponent },
      { path: 'projects', component: ProjectManagementComponent },
      { path: 'tasks', component: TaskManagementComponent },
      {
        path: 'roles',
        component: RoleAssignmentComponent,
        canActivate: [RoleGuard],
        data: { role: 'admin' }
      },
      { path: '', redirectTo: 'employees', pathMatch: 'full' }
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
