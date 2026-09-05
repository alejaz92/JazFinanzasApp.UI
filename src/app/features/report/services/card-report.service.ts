import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { CardGeneralReport, CardDetailReport, CardFutureCommitment, CardPromotionsReport } from '../models/card-report.model';
import { CardTransactionPaymentList } from '../../cardTransactions/models/CardTransactionPayment-List.model';

@Injectable({
  providedIn: 'root'
})
export class CardReportService {

  constructor(private http: HttpClient) { }

  getGeneral(assetId: number): Observable<CardGeneralReport> {
    return this.http.get<CardGeneralReport>(`${environment.apiBaseURL}/api/cardreport/General/${assetId}`);
  }

  getByCard(cardId: number, assetId: number): Observable<CardDetailReport> {
    return this.http.get<CardDetailReport>(`${environment.apiBaseURL}/api/cardreport/ByCard/${cardId}/${assetId}`);
  }

  getFutureCommitment(assetId: number): Observable<CardFutureCommitment> {
    return this.http.get<CardFutureCommitment>(`${environment.apiBaseURL}/api/cardreport/FutureCommitment/${assetId}`);
  }

  getPromotions(assetId: number): Observable<CardPromotionsReport> {
    return this.http.get<CardPromotionsReport>(`${environment.apiBaseURL}/api/cardreport/Promotions/${assetId}`);
  }

  getMonthSummary(month: string): Observable<CardTransactionPaymentList[]> {
    return this.http.get<CardTransactionPaymentList[]>(`${environment.apiBaseURL}/api/cardreport/MonthSummary?month=${month}`);
  }
}
