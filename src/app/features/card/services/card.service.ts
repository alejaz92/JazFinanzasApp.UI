import { Injectable, OnDestroy } from '@angular/core';
import { CardAddRequest } from '../models/card-add-request.model';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Card } from '../models/card.model';
import { environment } from 'src/environments/environment.development';
import { CardUpdateRequest } from '../models/card-update-request.model';

@Injectable({
  providedIn: 'root'
})
export class CardService {

  constructor(private http: HttpClient) { }

  addCard(model: CardAddRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/card/test`, model);
  }

  getAllCards(): Observable<Card[]> {
    return this.http.get<Card[]>(`${environment.apiBaseURL}/api/card/test`);
  }

  getCardById(id: number): Observable<Card> {
    return this.http.get<Card>(`${environment.apiBaseURL}/api/card/test/${id}`);
  }
  updateCard(id: number,cardUpdateRequest: CardUpdateRequest):
   Observable<Card> {
    return this.http.put<Card>(`${environment.apiBaseURL}/api/card/test/${id}`, cardUpdateRequest);
  }

  deleteCard(id: number): Observable<Card> {
    return this.http.delete<Card>(`${environment.apiBaseURL}/api/card/test/${id}`);
  }
}
