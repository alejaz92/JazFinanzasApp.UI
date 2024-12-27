import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, of } from 'rxjs';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiBaseURL}/api/auth`;
  private tokenKey = 'authToken';

  constructor(private http: HttpClient, private router: Router) { }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password })
    .pipe(
      tap(response => {
        localStorage.setItem(this.tokenKey, response.token);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !this.isTokenExpired();
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) {
      return true;
    }
  
    const payload = JSON.parse(atob(token.split('.')[1])); // Decodifica el payload del JWT
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now; // Verifica si el token ha expirado
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }
}
