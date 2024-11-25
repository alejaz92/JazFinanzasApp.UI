import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CryptoTransaction } from '../models/CryptoTransaction.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { CryptoTransactionAdd } from '../models/CryptoTransactionAdd.model';

@Injectable({
  providedIn: 'root'
})
export class CryptoTransactionService {

  constructor(private http: HttpClient) { }

  getCryptoTransactions(page: number, itemsPerPage: number): Observable<{ movements: CryptoTransaction[], totalCount: number}> {
    return this.http.get<{ movements: CryptoTransaction[], totalCount: number}>(`${environment.apiBaseURL}/api/CryptoTransaction?page=${page}&itemsPerPage=${itemsPerPage}`);
  }

  createCryptoTransaction(movement: CryptoTransactionAdd): Observable<CryptoTransactionAdd> {
    return this.http.post<CryptoTransactionAdd>(`${environment.apiBaseURL}/api/CryptoTransaction`, movement);
  }

  deleteCryptoTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/CryptoTransaction/${id}`);
  }

}
