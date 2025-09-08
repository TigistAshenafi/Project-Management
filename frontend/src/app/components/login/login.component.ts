import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/Services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastrService: ToastrService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }
  ngOnInit(): void {

  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  
  onSubmit() {
    if (this.loginForm.valid) {
      console.log("loginForm",this.loginForm);

      this.authService.login(this.loginForm.value).subscribe({
        next: (user) => {
          localStorage.setItem('user_id', user.id.toString()); // during login/signup
          this.toastrService.success('Login Successful', 'Success', {
            toastClass: 'toast-success',
            positionClass: 'toast-center-center',
          });
        },
        error: (err) => {
          this.toastrService.error('Failed to Login', 'Error', {
          toastClass: 'toast-error',
          positionClass: 'toast-center-center',
        });
        console.error(err);
      }
    });
  }
}
}
