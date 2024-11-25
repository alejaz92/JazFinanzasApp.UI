import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StockTransaction } from '../models/stockTransaction.model';
import { StockTransactionAdd } from '../models/stockTransactionAdd.model';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class StockTranctionsService {

  constructor(private http: HttpClient) { }

  getStockTransactions(page: number, itemsPerPage: number): Observable<{ transactions: StockTransaction[], totalCount: number}> {
    return this.http.get<{ transactions: StockTransaction[], totalCount: number}>(`${environment.apiBaseURL}/api/stockTransaction?page=${page}&itemsPerPage=${itemsPerPage}`);
  }

  createStockTransaction(transaction: StockTransactionAdd): Observable<StockTransactionAdd> {
    return this.http.post<StockTransactionAdd>(`${environment.apiBaseURL}/api/stockTransaction`, transaction);
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/stockTransaction/${id}`);
  }

}
