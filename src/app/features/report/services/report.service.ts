import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { Balance } from '../models/Balance.modelt';
import { TotalBalance } from '../models/TotalBalance.model';

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
}
