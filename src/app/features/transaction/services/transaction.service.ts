import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { TransactionAdd } from '../models/transaction-add.model';
import { TransactionRefund } from '../models/transaction-refund.model';

// Drill-down desde los reportes de Ingresos y Egresos (Fase 13): filtros opcionales, todos sin
// efecto cuando se omiten — mismo comportamiento de siempre para la pantalla general.
export interface TransactionListFilters {
  classId?: number;
  tagId?: number;
  from?: string;
  to?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  constructor(private http: HttpClient) { }
  
  getTransactions(page: number, itemsPerPage: number, filters?: TransactionListFilters): Observable<{ transactions: Transaction[], totalCount: number}> {
    let url = `${environment.apiBaseURL}/api/transaction?page=${page}&itemsPerPage=${itemsPerPage}`;
    if (filters?.classId != null) url += `&classId=${filters.classId}`;
    if (filters?.tagId != null) url += `&tagId=${filters.tagId}`;
    if (filters?.from) url += `&from=${filters.from}`;
    if (filters?.to) url += `&to=${filters.to}`;
    return this.http.get<{ transactions: Transaction[], totalCount: number}>(url);
  }
  createTransaction(transaction: TransactionAdd): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${environment.apiBaseURL}/api/transaction`, transaction);
  }
  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/transaction/${id}`);
  }
  getTransactionById(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${environment.apiBaseURL}/api/transaction/${id}`);
  }
  updateTransaction(id: number, transaction: Transaction): Observable<Transaction> {
    return this.http.put<Transaction>(`${environment.apiBaseURL}/api/transaction/${id}`, transaction);
  }

  refundTransaction(id: number, refund: TransactionRefund): Observable<TransactionRefund> {
    return this.http.post<TransactionRefund>(`${environment.apiBaseURL}/api/transaction/refund/${id}`, refund);
  }

}
