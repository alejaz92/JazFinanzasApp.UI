import { AfterViewInit, Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
declare var bootstrap: any;



@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit{
  isLoading: boolean = false;
  username: string = '';
  password: string = '';
  errorMessages: string = '';

  constructor(private authService: AuthService, private router: Router) { }
  


  login(): void {
    this.isLoading = true;
    this.authService.login(this.username,this.password).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessages = 'Usuario y/o contraseña incorrectos';
      }
    });
  }

  ngAfterViewInit(): void {
    // Inicializa todos los tooltips en la página
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach((tooltipTriggerEl) => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
}
