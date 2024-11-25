import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CardTransactionPending } from '../models/cardTransactions-pending.model';
import { environment } from 'src/environments/environment.development';
import { CardTransactionsAdd } from '../models/cardTransactions-add.model';
import { CardTransactionPaymentList } from '../models/CardTransactionPayment-List.model';
import { RecurrentCardTransactionGet, RecurrentCardTransactionPut } from '../models/CardTransaction-recurrent.model';


@Injectable({
  providedIn: 'root'
})
export class CardTransactionsService {

  constructor(private http: HttpClient) { }

  getPendingCardTransactions(): Observable<CardTransactionPending[]> {
    return this.http.get<CardTransactionPending[]>(`${environment.apiBaseURL}/api/cardTransaction`);
  }

  addCardTransaction(cardTransaction: CardTransactionsAdd): Observable<CardTransactionsAdd> {
    return this.http.post<CardTransactionsAdd>(`${environment.apiBaseURL}/api/CardTransaction`, cardTransaction);
  }

  getPaymentCardTransactions(cardId: Number, paymentMonth: string): Observable<CardTransactionPaymentList[]> {
    return this.http.get<CardTransactionPaymentList[]>(`${environment.apiBaseURL}/api/CardTransaction/CardPayments?CardId=${cardId}&paymentMonth=${paymentMonth}`);
    
  }

  createCardPayment(cardTransaction: any): Observable<any> {
    return this.http.post<any>(`${environment.apiBaseURL}/api/CardTransaction/CardPayments`, cardTransaction);
  }

  getRecurrentCardTransactions(id: number): Observable<RecurrentCardTransactionGet> {
    return this.http.get<RecurrentCardTransactionGet>(`${environment.apiBaseURL}/api/CardTransaction/editRecurrent/${id}`);
  }

  editRecurrentCardTransaction(id: number, cardTransaction: RecurrentCardTransactionPut): Observable<RecurrentCardTransactionPut> {
    return this.http.put<RecurrentCardTransactionPut>(`${environment.apiBaseURL}/api/CardTransaction/editRecurrent/${id}`, cardTransaction);
  }

}
