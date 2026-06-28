import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { first } from 'rxjs';
import { UserService } from '../services/user.service';
import { NgClass, NgIf } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css'],
    imports: [FormsModule, ReactiveFormsModule, NgClass, NgIf, BackButtonComponent]
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.profileForm = this.formBuilder.group({
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });



    this.userService.getUserData().pipe(first()).subscribe(
      data => {
        this.profileForm.patchValue({
          name: data.name,
          lastName: data.lastName,
          email: data.email
        });
        },
      error => {
        this.toastService.error('Error al cargar los datos del usuario');
      }
    );
  }

  get f() { return this.profileForm.controls; }

  onSubmit() {
    this.submitted = true;
    if (this.profileForm.invalid) {
      return;
    }

    this.loading = true;
    this.userService.updateUserData(this.profileForm.value).pipe(first()).subscribe(
      (data: any) => {
        this.loading = false;
        this.toastService.success('Datos actualizados correctamente');
      },
      (error: any) => {
        this.toastService.error('Error al actualizar los datos');
        this.loading = false;
      }
    );
  }
}

