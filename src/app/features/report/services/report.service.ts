import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { Balance } from '../models/Balance.modelt';
import { TotalBalance } from '../models/TotalBalance.model';
import { IncExpStats } from '../models/IncExpStats.model';
import { CardStats } from '../models/CardStats.model';
import { StockStatsDTO } from '../models/StockStats.model';
import { CryptoGralStatsDTO } from '../models/CryptoGralStats.model';
import { CryptoStatsDTO } from '../models/CryptoStats.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(private http: HttpClient) { }

  getBalance(assetId: number): Observable<Balance[]> {
    return this.http.get<Balance[]>(`${environment.apiBaseURL}/api/report/balance/${assetId}`);
  }

  getTotalBalance(): Observable<TotalBalance[]> {
    return this.http.get<TotalBalance[]>(`${environment.apiBaseURL}/api/report/balance`);
  }

  getIncExpStats(month: string, assetId: number): Observable<IncExpStats> {
    return this.http.get<IncExpStats>(`${environment.apiBaseURL}/api/report/IncExpStats?month=${month}&assetId=${assetId}`);
  }

  getCardStats(cardId: number): Observable<CardStats> {
    return this.http.get<CardStats>(`${environment.apiBaseURL}/api/report/CardStats/${cardId}`);
  }

  getStockStats(assetTypeId: number): Observable<StockStatsDTO> {
    return this.http.get<StockStatsDTO>(`${environment.apiBaseURL}/api/report/StockStats/${assetTypeId}`);
  }

  getCryptoGralStats(includeStables: boolean): Observable<CryptoGralStatsDTO> {
    return this.http.get<CryptoGralStatsDTO>(`${environment.apiBaseURL}/api/report/CryptoGralStats?includeStables=${includeStables}`);
  }

  getCryptoStats(cryptoId: number): Observable<CryptoStatsDTO> {
    return this.http.get<CryptoStatsDTO>(`${environment.apiBaseURL}/api/report/CryptoStats/${cryptoId}`);
  }
}
