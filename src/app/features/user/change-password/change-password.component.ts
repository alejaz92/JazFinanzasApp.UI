import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../services/user.service';
import { first } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm!: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private router: Router
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
          this.successMessage = 'La contraseña ha sido actualizada correctamente.';
          this.errorMessage = '';
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 3000);
        },
        error => {
          this.errorMessage = 'Error al cambiar la contraseña. Intente nuevamente.';
          this.successMessage = '';
          this.loading = false;
        }
      );
  }
}