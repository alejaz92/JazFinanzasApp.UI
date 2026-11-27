import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import {
  RecurringExpenseCreate, RecurringExpenseDetail, RecurringExpenseEdit, RecurringExpenseListItem, RecurringExpensePaymentRegister,
  RecurringExpenseReactivate, RecurringExpenseSourceChange, RecurringMonthMark, RecurringPaymentCandidate, RecurringPurchaseCandidate
} from '../models/recurring-expense.model';

@Injectable({
  providedIn: 'root'
})
export class RecurringExpensesService {

  constructor(private http: HttpClient) { }

  private url(path: string = ''): string {
    return `${environment.apiBaseURL}/api/RecurringExpense${path}`;
  }

  getAll(): Observable<RecurringExpenseListItem[]> {
    return this.http.get<RecurringExpenseListItem[]>(this.url());
  }

  getById(id: number): Observable<RecurringExpenseDetail> {
    return this.http.get<RecurringExpenseDetail>(this.url(`/${id}`));
  }

  create(dto: RecurringExpenseCreate): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.url(), dto);
  }

  edit(id: number, dto: RecurringExpenseEdit): Observable<void> {
    return this.http.put<void>(this.url(`/${id}`), dto);
  }

  // Solo una que no tenga cobros.
  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.url(`/${id}`));
  }

  changeSource(id: number, dto: RecurringExpenseSourceChange): Observable<void> {
    return this.http.put<void>(this.url(`/${id}/source`), dto);
  }

  // `month` es el primer mes sin ella.
  cancel(id: number, month: string): Observable<void> {
    return this.http.post<void>(this.url(`/${id}/cancel`), { month });
  }

  reactivate(id: number, dto: RecurringExpenseReactivate): Observable<void> {
    return this.http.post<void>(this.url(`/${id}/reactivate`), dto);
  }

  // `status` en null quita la marca del mes.
  setMonthStatus(id: number, month: string, status: RecurringMonthMark | null): Observable<void> {
    return this.http.put<void>(this.url(`/${id}/months`), { month, status });
  }

  registerPayment(id: number, dto: RecurringExpensePaymentRegister): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.url(`/${id}/payments`), dto);
  }

  getPaymentCandidates(id: number, month: string): Observable<RecurringPaymentCandidate[]> {
    return this.http.get<RecurringPaymentCandidate[]>(this.url(`/${id}/payments/candidates?month=${month}`));
  }

  linkPayment(id: number, transactionId: number, month: string): Observable<void> {
    return this.http.put<void>(this.url(`/${id}/payments/${transactionId}`), { month });
  }

  movePayment(id: number, transactionId: number, month: string): Observable<void> {
    return this.http.put<void>(this.url(`/${id}/payments/${transactionId}/month`), { month });
  }

  // El movimiento sigue existiendo: solo deja de ser de la ficha.
  unlinkPayment(id: number, transactionId: number): Observable<void> {
    return this.http.delete<void>(this.url(`/${id}/payments/${transactionId}`));
  }

  getPurchaseCandidates(id: number, month: string): Observable<RecurringPurchaseCandidate[]> {
    return this.http.get<RecurringPurchaseCandidate[]>(this.url(`/${id}/purchases/candidates?month=${month}`));
  }

  linkPurchase(id: number, cardTransactionId: number): Observable<void> {
    return this.http.put<void>(this.url(`/${id}/purchases/${cardTransactionId}`), {});
  }
}
