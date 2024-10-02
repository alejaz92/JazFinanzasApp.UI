import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/features/auth/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  constructor(public router: Router, private authService: AuthService) { }
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
