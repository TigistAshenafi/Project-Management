import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmployeeService } from '../../core/Services/employee.service';
import { ToastrService } from 'ngx-toastr';
import { Employee } from '../../core/models/employee.model';
import { AuthService } from 'src/app/core/Services/auth.service';
import { UserService } from 'src/app/core/Services/user.service'; // Import UserService

interface User {
  id: number;
  username: string;
  role: string;
}

@Component({
  selector: 'app-employee',
  templateUrl: './employee-management.component.html',
  styleUrls: ['./employee-management.component.css']
})
export class EmployeeManagementComponent implements OnInit {
  employeeForm!: FormGroup;
  employees: Employee[] = [];
  showForm: boolean = false;
  editMode: boolean = false;
  currentPage: number = 1;
  selectedEmployeeId: number | null = null;
  private autoRefreshHandle: any;
  job_types = ['On-site/Permanent', 'On-site/Contract', 'Contract', 'Remote', 'Hybrid'];
  filter = {
  name: '',
  position: ''
};
  filteredEmployees: Employee[] = [];
  userRoles: string[] = ['EMPLOYEE', 'PROJECT_MANAGER', 'ADMIN']; // Add this line
  availableUsers: User[] = []; // New property to store available users


  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private toastr: ToastrService,
    public authService: AuthService,
    private userService: UserService // Inject UserService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadEmployees();
    this.loadAvailableUsers(); // Load available users
    console.log('Is Admin:', this.authService.isAdmin());
    console.log('Current User Value:', this.authService.currentUserValue);

    // Auto-refresh list every 15s to reflect invite claims
    this.autoRefreshHandle = setInterval(() => {
      this.loadEmployees();
    }, 15000);
  }

  ngOnDestroy(): void {
    if (this.autoRefreshHandle) {
      clearInterval(this.autoRefreshHandle);
      this.autoRefreshHandle = null;
    }
  }

  initForm(): void {
    this.employeeForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      position: ['', Validators.required],
      job_type: ['On-Site', [Validators.required]],
      role: ['EMPLOYEE', Validators.required]
    });
  }

  loadAvailableUsers(): void {
    // No longer needed with invite-only approach
  }

  loadEmployees(): void {
    this.employeeService.getAllEmployee().subscribe({
      next: (data) => {
        this.employees = data;
        this.applyFilters();
        this.loadAvailableUsers(); // Refresh available users after loading employees
      },
      error: (err) => {
        console.error('Failed to load employees:', err);
      }
    });
  }

  applyFilters(): void {
  this.filteredEmployees = this.employees.filter(emp => {
    const matchesName = !this.filter.name || emp.name.toLowerCase().includes(this.filter.name.toLowerCase());
    const matchesPosition = !this.filter.position || emp.position.toLowerCase().includes(this.filter.position.toLowerCase());
    return matchesName && matchesPosition;
  });
}
clearFilters(): void {
  this.filter.name = '';
  this.filter.position = '';
  this.applyFilters();
}


  get formControls() {
    return this.employeeForm.controls;
  }

  toggleAddForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  submitEmployee(): void {
    if (this.employeeForm.invalid) return;

    if (this.editMode && this.selectedEmployeeId !== null) {
      this.updateEmployee();
    } else {
      this.createEmployee();
    }
  }

  createEmployee(): void {
    if (this.employeeForm.invalid) return;

    const newEmployee: Employee = this.employeeForm.value;

    this.employeeService.createEmployee(newEmployee).subscribe({
      next: (response: any) => {
        console.log('Employee created:', response);

        // Show the invite link to the admin
        this.showInviteLink(response.invite_token, newEmployee.name, newEmployee.email);

        this.toastr.success('Employee created successfully!', 'Success', {
          toastClass: 'toast-success',
          positionClass: 'toast-center-center',
        });

        this.loadEmployees(); // <-- Refresh list
        this.resetForm();
        this.showForm = false;
      },
      error: (err) => {
        this.toastr.error('Failed to create employee', 'Error', {
          toastClass: 'toast-error',
          positionClass: 'toast-center-center',
        });
        console.error(err);
      }
    });
  }

  showInviteLink(inviteToken: string, employeeName: string, employeeEmail: string): void {
    if (!inviteToken) {
      this.toastr.error('No invite token available for this employee', 'Error');
      return;
    }

    const inviteLink = `${window.location.origin}/invite-claim?token=${inviteToken}`;

    // Create a modal with the invite details
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 10px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    modalContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #28a745; margin: 0;">🎉 Employee Invitation Created!</h2>
      </div>

      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Employee Details:</h3>
        <p style="margin: 5px 0;"><strong>Name:</strong> ${employeeName}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${employeeEmail}</p>
      </div>

      <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #1976d2;">🔗 Invite Link:</h3>
        <div style="background: white; padding: 10px; border: 1px solid #ddd; border-radius: 3px; word-break: break-all; font-family: monospace; font-size: 12px;">
          ${inviteLink}
        </div>
        <button onclick="navigator.clipboard.writeText('${inviteLink}')" style="margin-top: 10px; padding: 8px 15px; background: #1976d2; color: white; border: none; border-radius: 3px; cursor: pointer;
        transition: all 0.2s ease;" title="Copy invite link to clipboard"
        transition: all 0.2s ease; hover:transform: scale(1.01);
  hover:transition: var(--transition); hover: background: #1565c0;">
          <i class="fa-regular fa-clone"></i>
        </button>
      </div>

      <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #856404;">📋 Instructions for Admin:</h3>
        <ol style="margin: 0; padding-left: 20px;">
          <li>Copy the invite link above</li>
          <li>Send it to the employee via email, WhatsApp, or any messaging platform</li>
          <li>The employee will click the link to set up their account</li>
          <li>Once they complete registration, their status will change to "Active"</li>
        </ol>
      </div>

      <div style="text-align: center;">
        <button onclick="this.closest('.modal').remove()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;
        font-size: 16px; transition: all 0.2s ease; hover:transform: translateY(1.3px);">
          Close
        </button>
      </div>
    `;

    modal.className = 'modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Also log to console for easy copying
    console.log('=== INVITE DETAILS ===');
    console.log('Employee:', employeeName);
    console.log('Email:', employeeEmail);
    console.log('Invite Link:', inviteLink);
    console.log('=====================');
  }

  updateEmployee(): void {
    if (this.selectedEmployeeId === null) return;

    const updatedEmployee: Employee = {
      id: this.selectedEmployeeId,
      ...this.employeeForm.value
    };

    this.employeeService.updateEmployee(this.selectedEmployeeId, updatedEmployee).subscribe({
      next: (e) => {
        console.log('e', e);
        this.toastr.success('Employee updated successfully', 'Success', {
          toastClass: 'toast-success',
          positionClass: 'toast-center-center',
        });

        this.loadEmployees(); // <-- Refresh list
        this.resetForm();
        this.editMode = false;
        this.showForm = false;
      },
      error: (err) => {
        this.toastr.error('Failed to update employee', 'Error',{
          toastClass: 'toast-error',
          positionClass: 'toast-center-center',
        });
        console.error(err);
      }
    });
  }

  onEdit(employee: Employee): void {
    this.employeeForm.patchValue(employee);
    this.editMode = true;
    this.showForm = true;
    this.selectedEmployeeId = employee.id ?? null;
  }

  resendInvite(employee: Employee): void {
    if (employee.id) {
      this.employeeService.resendInvite(employee.id).subscribe({
        next: (response: any) => {
          // Show the new invite link
          this.showInviteLink(response.invite_token, employee.name, employee.email);

          this.toastr.success('Invite resent successfully!', 'Success');
          this.loadEmployees();
        },
        error: (err: any) => {
          this.toastr.error('Failed to resend invite', 'Error');
          console.error(err);
        }
      });
    }
  }

  // Remove onRoleChange method as roles will be managed via the main form

  onRoleChange(employeeId: number, event: any): void {
    const newRole = event.target.value;
    this.employeeService.updateEmployeeRole(employeeId, newRole).subscribe({
      next: () => {
        this.toastr.success(`Role updated to ${newRole} successfully!`, 'Success');
        const updatedEmployeeIndex = this.employees.findIndex(emp => emp.id === employeeId);
        if (updatedEmployeeIndex > -1) {
          this.employees[updatedEmployeeIndex].role = newRole;
          this.applyFilters();
        }
      },
      error: (err) => {
        this.toastr.error('Failed to update employee role', 'Error');
        console.error(err);
      }
    });
  }


  onDelete(id: number): void {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.employeeService.deleteEmployee(id).subscribe({
        next: () => {
          this.loadEmployees();
          this.employees = this.employees.filter(emp => emp.id !== id);
          this.toastr.success('Employee deleted successfully', 'Success', {
          toastClass: 'toast-success',
          positionClass: 'toast-center-center',
          });
        },
        error: (err) => {
          this.toastr.error('Failed to delete employee', 'Error',{
          toastClass: 'toast-error',
          positionClass: 'toast-center-center',
          });
          console.error(err);
        }
      });
    }
  }

  onCancel(): void {
    this.resetForm();
    this.editMode = false;
    this.showForm = false;
  }

  resetForm(): void {
    this.employeeForm.reset();
    this.selectedEmployeeId = null;
    this.employeeForm.patchValue({ job_type: 'On-Site', role: 'EMPLOYEE' });
  }
}
