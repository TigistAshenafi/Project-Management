import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Employee {
  id?: string;
  name: string;
  position: string;
  salary: number;
}

@Component({
  selector: 'app-employee-form',
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.css']
})
export class EmployeeFormComponent implements OnInit {

  @Input() employee: Employee | null = null;
  @Output() submit = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  employeeForm!: FormGroup;
  editMode = false;
  showForm = false;
  employees: Employee[] = [];
  selectedEmployee: Employee | null = null;
  editingEmployeeId: string | null = null;

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit() {
    this.initializeForm();
    if (this.employee) {
      this.editMode = true;
      this.employeeForm.patchValue(this.employee);
    }
    this.loadEmployees();
  }

  // Initialize the form with validation
  initializeForm() {
    this.employeeForm = this.fb.group({
      name: ['', Validators.required],
      position: ['', Validators.required],
      salary: [null, [Validators.required, Validators.min(0)]]
    });
  }

  // Getter for form controls
  get formControls() {
    return this.employeeForm.controls;
  }

  // Toggle form visibility
  toggleAddForm() {
    if (this.editingEmployeeId) {
      this.onCancel(); // Optional: cancel edit if user clicks "Add" while editing
    } else {
      this.showForm = !this.showForm;
      if (this.showForm) {
        this.employeeForm.reset();
      }
    }
  }

  // Handle form submission (either create or update)
  onSubmit() {
    if (this.employeeForm.valid) {
      if (this.editMode) {
        this.updateEmployee();
      } else {
        this.addEmployee();
      }
    }
  }

  // Handle cancel action
  onCancel() {
    this.cancel.emit();
    this.showForm = false;
    this.resetForm();
  }

  // Reset the form for new data
  resetForm() {
    this.employeeForm.reset();
    this.editMode = false;
  }

  // Add a new employee
  addEmployee() {
    if (this.employeeForm.invalid) return;

    const employeeData = this.employeeForm.value;
    this.http.post<Employee>('http://localhost:8081/api/employees', employeeData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe(() => {
      this.resetForm();
      this.showForm = false;
      this.loadEmployees();
    });
  }

  // Update an existing employee
  updateEmployee() {
    if (this.editingEmployeeId === null || this.employeeForm.invalid) return;

    const updatedEmployee = { id: this.editingEmployeeId, ...this.employeeForm.value };
    this.http.put<Employee>(`http://localhost:8081/api/employees/${this.editingEmployeeId}`, updatedEmployee, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe(() => {
      this.resetForm();
      this.editingEmployeeId = null;
      this.showForm = false;
      this.loadEmployees();
    });
  }

  // Load the list of employees from the backend
  loadEmployees() {
    this.http.get<Employee[]>('http://localhost:8081/api/employees', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe(data => {
      this.employees = data;
    });
  }
}
