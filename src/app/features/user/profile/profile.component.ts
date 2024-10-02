import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService
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
        this.errorMessage = 'Erorr al cargar los datos del usuario';
      }
    );
  }

  get f() { return this.profileForm.controls; }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    if (this.profileForm.invalid) {
      return;
    }

    this.loading = true;
    this.userService.updateUserData(this.profileForm.value).pipe(first()).subscribe(
      (data: any) => {
        this.loading = false;
        this.errorMessage = 'Datos actualizados correctamente';
      },
      (error: any) => {
        this.errorMessage = 'Error al actualizar los datos';
        this.loading = false;
      }
    );
  }
}

