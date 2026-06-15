import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { PersonDebtSummary, SharedExpenseAdd, SharedExpenseDetail } from '../models/shared-expense.model';

@Injectable({
  providedIn: 'root'
})
export class SharedExpenseService {

  constructor(private http: HttpClient) { }

  createSharedExpense(dto: SharedExpenseAdd): Observable<SharedExpenseDetail> {
    return this.http.post<SharedExpenseDetail>(`${environment.apiBaseURL}/api/shared-expense`, dto);
  }

  getByTransactionId(transactionId: number): Observable<SharedExpenseDetail> {
    return this.http.get<SharedExpenseDetail>(`${environment.apiBaseURL}/api/shared-expense/transaction/${transactionId}`);
  }

  deleteSharedExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/shared-expense/${id}`);
  }

  getSummary(): Observable<PersonDebtSummary[]> {
    return this.http.get<PersonDebtSummary[]>(`${environment.apiBaseURL}/api/shared-expense/summary`);
  }
}
