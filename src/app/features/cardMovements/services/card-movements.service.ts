import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CardMovementPending } from '../models/cardMovements-pending.model';
import { environment } from 'src/environments/environment.development';
import { CardMovementsAdd } from '../models/cardMovements-add.model';
import { CardMovementPaymentList } from '../models/CardMovementPayment-List.model';
import { RecurrentCardMovementGet, RecurrentCardMovementPut } from '../models/CardMovement-recurrent.model';


@Injectable({
  providedIn: 'root'
})
export class CardMovementsService {

  constructor(private http: HttpClient) { }

  getPendingCardMovements(): Observable<CardMovementPending[]> {
    return this.http.get<CardMovementPending[]>(`${environment.apiBaseURL}/api/cardMovement`);
  }

  addCardMovement(cardMovement: CardMovementsAdd): Observable<CardMovementsAdd> {
    return this.http.post<CardMovementsAdd>(`${environment.apiBaseURL}/api/CardMovement`, cardMovement);
  }

  getPaymentCardMovements(cardId: Number, paymentMonth: string): Observable<CardMovementPaymentList[]> {
    return this.http.get<CardMovementPaymentList[]>(`${environment.apiBaseURL}/api/CardMovement/CardPayments?CardId=${cardId}&paymentMonth=${paymentMonth}`);
    
  }

  createCardPayment(cardMovement: any): Observable<any> {
    return this.http.post<any>(`${environment.apiBaseURL}/api/CardMovement/CardPayments`, cardMovement);
  }

  getRecurrentCardMovements(id: number): Observable<RecurrentCardMovementGet> {
    return this.http.get<RecurrentCardMovementGet>(`${environment.apiBaseURL}/api/CardMovement/editRecurrent/${id}`);
  }

  editRecurrentCardMovement(id: number, cardMovement: RecurrentCardMovementPut): Observable<RecurrentCardMovementPut> {
    return this.http.put<RecurrentCardMovementPut>(`${environment.apiBaseURL}/api/CardMovement/editRecurrent/${id}`, cardMovement);
  }

}
