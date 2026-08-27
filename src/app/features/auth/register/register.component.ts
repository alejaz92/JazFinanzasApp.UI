import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

import { last } from 'rxjs';
import { NgIf, NgClass } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { SubmitButtonComponent } from '../../../shared/components/submit-button/submit-button.component';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css'],
    imports: [NgIf, FormsModule, ReactiveFormsModule, NgClass, BackButtonComponent, SubmitButtonComponent]
})

export class RegisterComponent implements OnInit{
  registerForm!: FormGroup;
  submitted = false;
  isSubmitting = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService
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

    if (this.registerForm.invalid || this.isSubmitting) {
      return;
    }

    const registerData = this.registerForm.value;

    this.isSubmitting = true;
    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.toastService.success('Usuario registrado correctamente');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error al registrar el usuario', err);
        this.toastService.error('Error al registrar el usuario. Intente nuevamente');
      }
    });
  }
}
