import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/features/auth/services/auth.service';
import { UserService } from 'src/app/features/user/services/user.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  username: string = '';

  constructor(
    public router: Router, 
    private authService: AuthService, 
    private userService: UserService) { }


  ngOnInit(): void {
    this.loadUsername();
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
