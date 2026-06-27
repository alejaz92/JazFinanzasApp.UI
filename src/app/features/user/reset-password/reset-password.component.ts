import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { first } from 'rxjs';
import {  ResetPasswordDTO } from '../models/ResetPasswordDTO';
import { NgClass, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-reset-password',
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.css'],
    imports: [FormsModule, ReactiveFormsModule, NgClass, NgIf, RouterLink]
})
export class ResetPasswordComponent implements OnInit{
  resetPasswordForm!: FormGroup;
  submitted = false;
  errorMessage = '';
  succesMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.resetPasswordForm = this.formBuilder.group({
      username: ['', Validators.required]
    });
  }

  onSubmit() {
    
    this.errorMessage = '';

    if (this.resetPasswordForm.invalid) {
      this.submitted = true;
      return;
    }

    // assign the username to the resetPasswordDTO
    var resetPasswordDTO: ResetPasswordDTO = {
      userName: this.resetPasswordForm.value.username
    };



    this.userService.resetPassword(resetPasswordDTO).pipe(first()).subscribe(
      (data: any) => {
        this.succesMessage = 'Contraseña reseteada correctamente a: ' + this.resetPasswordForm.value.username + '123456';
      },
      error => {
        this.errorMessage = 'Error al resetear contraseña';
      }
    );


  }
}
