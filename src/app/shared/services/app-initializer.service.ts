import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/features/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitializerService {
  constructor(private authService: AuthService) {}

  // checkAuthStatus(): Observable<boolean> {
  //   return this.authService.isLoggedIn(); 
  // }
}
