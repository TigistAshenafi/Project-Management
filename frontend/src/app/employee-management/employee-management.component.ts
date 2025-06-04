import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmployeeService } from '../core/Services/employee.service';
import { ToastrService } from 'ngx-toastr';
import { Employee } from '../core/models/employee.model';

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
  filter = {
  name: '',
  position: ''
};
filteredEmployees: Employee[] = [];


  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadEmployees();
  }

  initForm(): void {
    this.employeeForm = this.fb.group({
      name: ['', Validators.required],
      position: ['', Validators.required],
      salary: [0, [Validators.required, Validators.min(0)]]
    });
  }

  loadEmployees(): void {
    this.employeeService.getAllEmployee().subscribe({
      next: (data) => {
        this.employees = data;
        this.applyFilters();
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
      next: (e) => {
        console.log('e', e);

        this.toastr.success('Employee created successfully', 'Success', {
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

  onDelete(id: number): void {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.employeeService.deleteEmployee(id).subscribe({
        next: () => {
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
    this.employeeForm.patchValue({ salary: 0 });
  }
}
