import { AfterViewInit, Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { SubmitButtonComponent } from '../../../shared/components/submit-button/submit-button.component';
declare var bootstrap: any;



@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    imports: [FormsModule, RouterLink, SubmitButtonComponent]
})
export class LoginComponent implements AfterViewInit{
  isSubmitting: boolean = false;
  username: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router, private toastService: ToastService) { }



  login(): void {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    this.authService.login(this.username,this.password).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.toastService.error('Usuario y/o contraseña incorrectos');
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
