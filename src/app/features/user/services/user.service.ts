import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { UpdateUser } from '../models/updateUser.model';
import {  ResetPasswordDTO } from '../models/ResetPasswordDTO';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  getUserData(): Observable<User> {
    return this.http.get<User>(`${environment.apiBaseURL}/api/user/`);
  }

  updateUserData(user: UpdateUser): Observable<UpdateUser> {
    return this.http.put<UpdateUser>(`${environment.apiBaseURL}/api/user`, user);
  }

  updatePassword(passwords: any): Observable<any> {
    return this.http.put<any>(`${environment.apiBaseURL}/api/user/updatePassword`, passwords);
  }

  // get username desde el api
  getUsername(): Observable< {userName: string }> {
    return this.http.get< {userName: string }>(`${environment.apiBaseURL}/api/user/getUserName`);
  }

  // reset password with the username
  resetPassword(resetPassword: ResetPasswordDTO): Observable<any> {
    return this.http.put<any>(`${environment.apiBaseURL}api/user/reset-password`, resetPassword);
  }
  
}
