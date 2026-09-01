import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { NetWorthGeneral, NetWorthMonthlyPoint, AccountBalance, CurrencyExposure, MonthlyBalancePoint } from '../models/net-worth.model';

@Injectable({
  providedIn: 'root'
})
export class NetWorthService {

  constructor(private http: HttpClient) { }

  getGeneral(): Observable<NetWorthGeneral> {
    return this.http.get<NetWorthGeneral>(`${environment.apiBaseURL}/api/networth/General`);
  }

  getMonthlySeries(assetId: number): Observable<NetWorthMonthlyPoint[]> {
    return this.http.get<NetWorthMonthlyPoint[]>(`${environment.apiBaseURL}/api/networth/Monthly/${assetId}`);
  }

  getByAccount(assetId: number): Observable<AccountBalance[]> {
    return this.http.get<AccountBalance[]>(`${environment.apiBaseURL}/api/networth/ByAccount/${assetId}`);
  }

  getByCurrency(assetId: number): Observable<CurrencyExposure[]> {
    return this.http.get<CurrencyExposure[]>(`${environment.apiBaseURL}/api/networth/ByCurrency/${assetId}`);
  }

  getDollarizedSeries(): Observable<MonthlyBalancePoint[]> {
    return this.http.get<MonthlyBalancePoint[]>(`${environment.apiBaseURL}/api/networth/DollarizedSeries`);
  }
}
