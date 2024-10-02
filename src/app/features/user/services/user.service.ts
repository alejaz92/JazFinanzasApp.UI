import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  getUserData(): Observable<User> {
    return this.http.get<User>(`${environment.apiBaseURL}/api/user/`);
  }

  updateUserData(user: User): Observable<User> {
    return this.http.put<User>(`${environment.apiBaseURL}/api/user/profile`, user);
  }
}
