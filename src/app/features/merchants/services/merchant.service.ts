import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { MerchantListItem, MerchantMovement, MerchantResolveBulkResult } from '../models/merchant.model';

@Injectable({
  providedIn: 'root'
})
export class MerchantService {

  constructor(private http: HttpClient) { }

  getAllMerchants(): Observable<MerchantListItem[]> {
    return this.http.get<MerchantListItem[]>(`${environment.apiBaseURL}/api/merchant`);
  }

  renameMerchant(id: number, name: string): Observable<void> {
    return this.http.put<void>(`${environment.apiBaseURL}/api/merchant/${id}`, { name });
  }

  mergeMerchants(sourceMerchantId: number, targetMerchantId: number): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/merchant/${sourceMerchantId}/merge/${targetMerchantId}`, {});
  }

  reassignTransaction(merchantId: number, transactionId: number): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/merchant/${merchantId}/transaction/${transactionId}`, {});
  }

  reassignCardTransaction(merchantId: number, cardTransactionId: number): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/merchant/${merchantId}/cardTransaction/${cardTransactionId}`, {});
  }

  resolveAll(): Observable<MerchantResolveBulkResult> {
    return this.http.post<MerchantResolveBulkResult>(`${environment.apiBaseURL}/api/merchant/resolve-all`, {});
  }

  getMovements(merchantId: number): Observable<MerchantMovement[]> {
    return this.http.get<MerchantMovement[]>(`${environment.apiBaseURL}/api/merchant/${merchantId}/movements`);
  }
}
