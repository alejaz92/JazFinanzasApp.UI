import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';



@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessages: string = '';

  constructor(private authService: AuthService, private router: Router) { }
  

  login(): void {
    this.authService.login(this.username,this.password).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        
        this.errorMessages = 'Usuario y/o contraseña incorrectos';
      }
    });
  }
}
