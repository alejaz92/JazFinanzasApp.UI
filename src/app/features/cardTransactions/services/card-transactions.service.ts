import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CardTransactionPending } from '../models/cardTransactions-pending.model';
import { environment } from 'src/environments/environment.development';
import { CardTransactionsAdd } from '../models/cardTransactions-add.model';
import { CardTransactionPaymentList } from '../models/CardTransactionPayment-List.model';
import { RecurrentCardTransactionGet, RecurrentCardTransactionPut } from '../models/CardTransaction-recurrent.model';
import { CardPurchaseMismatch } from '../models/card-purchase-mismatch.model';
import { PurchaseDifference } from '../models/purchase-difference.model';


@Injectable({
  providedIn: 'root'
})
export class CardTransactionsService {

  constructor(private http: HttpClient) { }

  getPendingCardTransactions(): Observable<CardTransactionPending[]> {
    return this.http.get<CardTransactionPending[]>(`${environment.apiBaseURL}/api/cardTransaction`);
  }

  addCardTransaction(cardTransaction: CardTransactionsAdd): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${environment.apiBaseURL}/api/CardTransaction`, cardTransaction);
  }

  getPaymentCardTransactions(cardId: Number, paymentMonth: string): Observable<CardTransactionPaymentList[]> {
    return this.http.get<CardTransactionPaymentList[]>(`${environment.apiBaseURL}/api/CardTransaction/CardPayments?CardId=${cardId}&paymentMonth=${paymentMonth}`);
    
  }

  createCardPayment(cardTransaction: any): Observable<any> {
    return this.http.post<any>(`${environment.apiBaseURL}/api/CardTransaction/CardPayments`, cardTransaction);
  }

  // Las compras con tarjeta que no cierran: lo que se dejó de pagar de sus cuotas no coincide con su reparto y sus descuentos (plan-repartos-y-descuentos-faltantes.md).
  getPurchaseMismatches(): Observable<CardPurchaseMismatch[]> {
    return this.http.get<CardPurchaseMismatch[]>(`${environment.apiBaseURL}/api/CardTransaction/mismatches`);
  }

  // Explica la diferencia de una compra ya pagada: un descuento, la parte de otras personas o un total mal cargado. No toca ningún saldo.
  explainPurchaseDifference(cardTransactionId: number, difference: PurchaseDifference): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/CardTransaction/${cardTransactionId}/difference`, difference);
  }

  registerEmptyMonth(request: any): Observable<any> {
    return this.http.post<any>(`${environment.apiBaseURL}/api/CardTransaction/CardPayments/NoExpenses`, request);
  }

  getRecurrentCardTransactions(id: number): Observable<RecurrentCardTransactionGet> {
    return this.http.get<RecurrentCardTransactionGet>(`${environment.apiBaseURL}/api/CardTransaction/editRecurrent/${id}`);
  }

  editRecurrentCardTransaction(id: number, cardTransaction: RecurrentCardTransactionPut): Observable<RecurrentCardTransactionPut> {
    return this.http.put<RecurrentCardTransactionPut>(`${environment.apiBaseURL}/api/CardTransaction/editRecurrent/${id}`, cardTransaction);
  }

}
