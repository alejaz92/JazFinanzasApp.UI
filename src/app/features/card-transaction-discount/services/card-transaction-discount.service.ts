import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { CardPendingCredit, CardTransactionDiscountAdd, CardTransactionDiscountDetail, CardTransactionDiscountRescue } from '../models/card-transaction-discount.model';

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

  getActive(): Observable<CardTransactionDiscountDetail[]> {
    return this.http.get<CardTransactionDiscountDetail[]>(`${environment.apiBaseURL}/api/card-transaction-discount/active`);
  }

  // Rescate: el banco pasa el saldo a favor de la tarjeta a una cuenta, total o parcialmente.
  rescue(id: number, dto: CardTransactionDiscountRescue): Observable<CardTransactionDiscountDetail> {
    return this.http.post<CardTransactionDiscountDetail>(`${environment.apiBaseURL}/api/card-transaction-discount/${id}/rescue`, dto);
  }

  // Saldo a favor todavía pendiente en una tarjeta, con el detalle de qué compras lo generaron.
  getPendingCredit(cardId: number): Observable<CardPendingCredit> {
    return this.http.get<CardPendingCredit>(`${environment.apiBaseURL}/api/card-transaction-discount/card/${cardId}/pending-credit`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/card-transaction-discount/${id}`);
  }
}
