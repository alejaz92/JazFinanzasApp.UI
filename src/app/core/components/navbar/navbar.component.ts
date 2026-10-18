import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from 'src/app/features/auth/services/auth.service';
import { UserService } from 'src/app/features/user/services/user.service';
import { NgIf } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { AssistantService } from 'src/app/features/assistant/services/assistant.service';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css'],
    imports: [NgIf, RouterLink]
})
export class NavbarComponent implements OnInit {
  username: string = '';
  isAdmin: boolean = false;

  // La entrada "Asistente" solo se muestra si el asistente está habilitado para el usuario (plan-devoluciones-llm, D12).
  assistantEnabled: boolean = false;
  private assistantChecked = false;

  constructor(
    public router: Router,
    private authService: AuthService,
    private userService: UserService,
    private assistantService: AssistantService,
    public themeService: ThemeService) { }


  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (!this.isLoginPage()) {
        
        this.loadUsername();
        this.isAdmin = this.authService.isAdmin();
        this.loadAssistantAccess();
      } else {
        // Al volver a /login puede entrar otro usuario: se vuelve a consultar.
        this.assistantEnabled = false;
        this.assistantChecked = false;
      }

    });
  }

  // Una sola consulta por sesión (no una por navegación). Si falla, la entrada simplemente no aparece.
  private loadAssistantAccess(): void {
    if (this.assistantChecked) return;
    this.assistantChecked = true;
    this.assistantService.getStatus().subscribe({
      next: status => this.assistantEnabled = status.enabled,
      error: () => this.assistantEnabled = false
    });
  }

  loadUsername(): void {
    this.userService.getUsername().subscribe(
      response => {
        this.username = response.userName;
      },
      error => {
        console.error('Error al obtener el nombre de usuario', error);
        //redireccionar a login
        this.router.navigate(['/login']);
      }
    );
  }

  isLoginPage(): boolean {
      if (this.router.url === '/login' || this.router.url === '/register') {
          return true;
      }
      return false;
  }

  logout(): void {
    this.authService.logout();
  }
}
