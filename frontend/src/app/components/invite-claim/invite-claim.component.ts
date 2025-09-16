import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-invite-claim',
  templateUrl: './invite-claim.component.html',
  styleUrls: ['./invite-claim.component.css']
})
export class InviteClaimComponent implements OnInit {
  inviteForm!: FormGroup;
  inviteToken: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.inviteToken = this.route.snapshot.queryParams['token'] || '';
    this.initForm();
  }

  initForm(): void {
    this.inviteForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      if (confirmPassword?.errors?.['passwordMismatch']) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }
    return null;
  }

  get formControls() {
    return this.inviteForm.controls;
  }

  onSubmit(): void {
    if (this.inviteForm.invalid || !this.inviteToken) {
      return;
    }

    const claimData = {
      invite_token: this.inviteToken,
      username: this.inviteForm.value.username,
      password: this.inviteForm.value.password
    };

    this.http.post(`${environment.userApiUrl}/api/claim-invite`, claimData).subscribe({
      next: (response) => {
        this.toastr.success('Account created successfully! You can now log in.', 'Success');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        if (err.status === 400) {
          this.toastr.error('Invalid or expired invite token', 'Error');
        } else if (err.status === 409) {
          this.toastr.error('Username already exists', 'Error');
        } else {
          this.toastr.error('Failed to create account', 'Error');
        }
        console.error(err);
      }
    });
  }
}

