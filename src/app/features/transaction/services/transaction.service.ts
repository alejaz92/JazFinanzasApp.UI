import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { TransactionAdd } from '../models/transaction-add.model';
import { TransactionRefund } from '../models/transaction-refund.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  constructor(private http: HttpClient) { }
  
  getTransactions(page: number, itemsPerPage: number): Observable<{ transactions: Transaction[], totalCount: number}> {
    return this.http.get<{ transactions: Transaction[], totalCount: number}>(`${environment.apiBaseURL}/api/transaction?page=${page}&itemsPerPage=${itemsPerPage}`);
  }
  createTransaction(transaction: TransactionAdd): Observable<TransactionAdd> {
    return this.http.post<TransactionAdd>(`${environment.apiBaseURL}/api/transaction`, transaction);
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
