import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../Services/auth.service';
import { FormBuilder, FormGroup } from '@angular/forms';

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  // Add other fields as necessary
}

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit {
  editingEmployeeId: string | null = null; // Track the ID of the employee being edited

  employees: any[] = [];
  showAddForm = false;
  showForm: boolean = false;
  employeeForm: FormGroup;
  selectedEmployee: Employee | null = null; // Add selectedEmployee property

  constructor(private http: HttpClient, private authService: AuthService, private formBuilder: FormBuilder) {
    this.employeeForm = this.formBuilder.group({
      id: [''],
      name: [''],
      position: [''],
      department: ['']
      // Add other fields as necessary
    });
  }

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.http.get<any[]>('http://localhost:8081/api/employees', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe(employee => {
      console.log("employee",employee);
      this.employees = employee;
      console.log("employees",this.employees);
    });

  }

  addEmployee(employee: any) {
    this.http.post('http://localhost:8081/api/employees', employee, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe(() => {
      this.loadEmployees();
      this.showAddForm = false;
    });
  }

   // Edit an existing employee
   onEdit(employee: Employee) {
    if (this.editingEmployeeId === employee.id && this.showForm) {
      this.onCancelEdit(); // Toggle off if same employee is being edited again
    } else {
      this.employeeForm.patchValue(employee);
      this.editingEmployeeId = employee.id ?? null;
      this.selectedEmployee = employee;
      this.showForm = true;
    }
  }

  // Cancel the edit action
  onCancelEdit() {
    this.employeeForm.reset();
    this.editingEmployeeId = null;
    this.showForm = false;
  }

  // Delete an employee
  onDelete(id: string) {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.http.delete(`http://localhost:8081/api/employees/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).subscribe(() => {
        this.loadEmployees(); // Refresh list after deletion
      });
    }
  }
}
