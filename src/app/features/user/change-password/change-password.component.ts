import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { first } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NgClass, NgIf } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
    selector: 'app-change-password',
    templateUrl: './change-password.component.html',
    imports: [FormsModule, ReactiveFormsModule, NgClass, NgIf, BackButtonComponent]
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm!: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Formulario reactivo con tres campos: contraseña actual, nueva contraseña y confirmación
    this.changePasswordForm = this.formBuilder.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      // Validación personalizada para asegurarse de que las contraseñas coincidan
      validators: this.passwordsMustMatch('newPassword', 'confirmPassword')
    });
  }

  // Fácil acceso a los controles del formulario
  get f() {
    return this.changePasswordForm.controls;
  }

  // Validador personalizado para comparar las contraseñas
  passwordsMustMatch(newPassword: string, confirmPassword: string) {
    return (formGroup: FormGroup) => {
      const passwordControl = formGroup.get(newPassword);
      const confirmPasswordControl = formGroup.get(confirmPassword);

      // Si ya hay otros errores en confirmPassword, no sobrescribir
      if (confirmPasswordControl && confirmPasswordControl.errors && !confirmPasswordControl.errors['mustMatch']) {
        return;
      }

      // Si las contraseñas no coinciden, establecer error
      if (passwordControl && confirmPasswordControl && passwordControl.value !== confirmPasswordControl.value) {
        confirmPasswordControl.setErrors({ mustMatch: true });
      } else {
        confirmPasswordControl?.setErrors(null); // Limpiar errores si coinciden
      }
    };
  }

  onSubmit() {
    this.submitted = true;

    // Detener si el formulario es inválido
    if (this.changePasswordForm.invalid) {
      return;
    }

    this.loading = true;

   

    // Llama al servicio para cambiar la contraseña

    const payload = {
      oldPassword: this.f['currentPassword'].value,
      newPassword: this.f['newPassword'].value
    }

    this.userService.updatePassword(payload)
      .pipe(first())
      .subscribe(
        data => {
          this.loading = false;
          this.toastService.success('La contraseña ha sido actualizada correctamente.');
          this.router.navigate(['/home']);
        },
        error => {
          this.toastService.error('Error al cambiar la contraseña. Intente nuevamente.');
          this.loading = false;
        }
      );
  }
}