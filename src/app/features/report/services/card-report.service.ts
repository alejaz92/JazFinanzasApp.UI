import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { CardGeneralReport, CardDetailReport, CardFutureCommitment, CardPromotionsReport } from '../models/card-report.model';

@Injectable({
  providedIn: 'root'
})
export class CardReportService {

  constructor(private http: HttpClient) { }

  getGeneral(): Observable<CardGeneralReport> {
    return this.http.get<CardGeneralReport>(`${environment.apiBaseURL}/api/cardreport/General`);
  }

  getByCard(cardId: number): Observable<CardDetailReport> {
    return this.http.get<CardDetailReport>(`${environment.apiBaseURL}/api/cardreport/ByCard/${cardId}`);
  }

  getFutureCommitment(): Observable<CardFutureCommitment> {
    return this.http.get<CardFutureCommitment>(`${environment.apiBaseURL}/api/cardreport/FutureCommitment`);
  }

  getPromotions(): Observable<CardPromotionsReport> {
    return this.http.get<CardPromotionsReport>(`${environment.apiBaseURL}/api/cardreport/Promotions`);
  }
}
