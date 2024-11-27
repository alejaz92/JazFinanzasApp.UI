import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

import { last } from 'rxjs';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})

export class RegisterComponent implements OnInit{
  registerForm!: FormGroup;
  submitted = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) { }
  

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      username: ['', Validators.required],
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    },
    {
      validator: this.mustMatch('password', 'confirmPassword')
      });
  }

  get f() { return this.registerForm.controls; }

  mustMatch(password: string, confirmPassword: string) {
    return (formGroup: FormGroup) => {
      const passControl = formGroup.controls[password];
      const confirmPassControl = formGroup.controls[confirmPassword];

      if (confirmPassControl.errors && !confirmPassControl.errors['mustMatch']) {
        return;
      }

      if(passControl.value !== confirmPassControl.value) {
        confirmPassControl.setErrors({ mustMatch: true });
      } else {
        confirmPassControl.setErrors(null);
      }
    };
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.registerForm.invalid) {
      return;
    }

    const registerData = this.registerForm.value;

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error al registrar el usuario', err);
        this.errorMessage = 'Error al registrar el usuario. Intente nuevamente';	
      }
    });
  }
}
