import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { first } from 'rxjs';
import {  ResetPasswordDTO } from '../models/ResetPasswordDTO';
import { NgClass, NgIf } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { SubmitButtonComponent } from '../../../shared/components/submit-button/submit-button.component';

@Component({
    selector: 'app-reset-password',
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.css'],
    imports: [FormsModule, ReactiveFormsModule, NgClass, NgIf, BackButtonComponent, SubmitButtonComponent]
})
export class ResetPasswordComponent implements OnInit{
  resetPasswordForm!: FormGroup;
  submitted = false;
  isSubmitting = false;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.resetPasswordForm = this.formBuilder.group({
      username: ['', Validators.required]
    });
  }

  onSubmit() {

    if (this.resetPasswordForm.invalid) {
      this.submitted = true;
      return;
    }

    if (this.isSubmitting) return;

    // assign the username to the resetPasswordDTO
    var resetPasswordDTO: ResetPasswordDTO = {
      userName: this.resetPasswordForm.value.username
    };



    this.isSubmitting = true;
    this.userService.resetPassword(resetPasswordDTO).pipe(first()).subscribe(
      (data: any) => {
        this.isSubmitting = false;
        this.toastService.success('Contraseña reseteada correctamente a: ' + this.resetPasswordForm.value.username + '123456');
      },
      error => {
        this.isSubmitting = false;
        this.toastService.error('Error al resetear contraseña');
      }
    );


  }
}
