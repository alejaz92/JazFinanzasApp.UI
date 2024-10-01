import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { Account } from '../models/account.model';
import { AccountAddRequest } from '../models/account-add-request.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  constructor(private http: HttpClient) { }
  getAllAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(`${environment.apiBaseURL}/api/account`);

  }
  deleteAccount(id: number): Observable<Account[]> {
    return this.http.delete<Account[]>(`${environment.apiBaseURL}/api/account/${id}`);
  }
  addAccount(model: AccountAddRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/account`, model);
  }  
  getAccountById(id: number): Observable<Account> {
    return this.http.get<Account>(`${environment.apiBaseURL}/api/account/${id}`);
  }
  updateAccount(id: number, account: AccountAddRequest): Observable<Account> {
    return this.http.put<Account>(`${environment.apiBaseURL}/api/account/${id}`, account);
  }
}
