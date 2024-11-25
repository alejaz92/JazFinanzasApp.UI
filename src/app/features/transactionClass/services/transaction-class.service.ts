import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TransactionClass } from '../models/transactionClass.model';
import { environment } from 'src/environments/environment.development';
import { TransactionClassAddRequest } from '../models/transactionClass-addRequest.model';



@Injectable({
  providedIn: 'root'
})
export class TransactionClassService {

  constructor(private http: HttpClient) { }

  getAllTransactionClasses(): Observable<TransactionClass[]> {
    return this.http.get<TransactionClass[]>(`${environment.apiBaseURL}/api/transactionClass`);
  }

  getTransactionClassById(id: number): Observable<TransactionClass> {
    return this.http.get<TransactionClass>(`${environment.apiBaseURL}/api/transactionClass/${id}`);
  }

  addTransactionClass(model: TransactionClassAddRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/transactionClass`, model);
  }

  updateTransactionClass(id: number, transactionClass: TransactionClass): Observable<TransactionClass> {
    return this.http.put<TransactionClass>(`${environment.apiBaseURL}/api/transactionClass/${id}`, transactionClass);
  }

  deleteTransactionClass(id: number): Observable<TransactionClass> {
    return this.http.delete<TransactionClass>(`${environment.apiBaseURL}/api/transactionClass/${id}`);
  }
}
