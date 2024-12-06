import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/features/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitializerService {
  constructor(private authService: AuthService) {}

  checkAuthStatus(): Observable<boolean> {
    //console.log(this.authService.isLoggedIn());
    return this.authService.isLoggedIn(); // Supón que devuelve un Observable<boolean>
  }
}
