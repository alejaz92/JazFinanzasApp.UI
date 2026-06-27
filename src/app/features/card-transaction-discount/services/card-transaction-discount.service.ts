import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { CardTransactionDiscountAdd, CardTransactionDiscountDetail } from '../models/card-transaction-discount.model';

@Injectable({
  providedIn: 'root'
})
export class CardTransactionDiscountService {

  constructor(private http: HttpClient) { }

  create(dto: CardTransactionDiscountAdd): Observable<CardTransactionDiscountDetail> {
    return this.http.post<CardTransactionDiscountDetail>(`${environment.apiBaseURL}/api/card-transaction-discount`, dto);
  }

  getByCardTransactionId(cardTransactionId: number): Observable<CardTransactionDiscountDetail> {
    return this.http.get<CardTransactionDiscountDetail>(`${environment.apiBaseURL}/api/card-transaction-discount/card-transaction/${cardTransactionId}`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/card-transaction-discount/${id}`);
  }
}
