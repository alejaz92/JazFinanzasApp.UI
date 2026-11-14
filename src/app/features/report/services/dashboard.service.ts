import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { DashboardCommitments, DashboardMonth, DashboardNetWorth, DashboardPendingItem } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private http: HttpClient) { }

  // plan-inicio-rapido.md, Fase 5 (D2): los cuatro bloques, cada uno su pedido.
  getNetWorth(assetId: number): Observable<DashboardNetWorth> {
    return this.http.get<DashboardNetWorth>(`${environment.apiBaseURL}/api/dashboard/${assetId}/net-worth`);
  }

  getMonth(assetId: number): Observable<DashboardMonth> {
    return this.http.get<DashboardMonth>(`${environment.apiBaseURL}/api/dashboard/${assetId}/month`);
  }

  getCommitments(): Observable<DashboardCommitments> {
    return this.http.get<DashboardCommitments>(`${environment.apiBaseURL}/api/dashboard/commitments`);
  }

  getPending(): Observable<DashboardPendingItem[]> {
    return this.http.get<DashboardPendingItem[]>(`${environment.apiBaseURL}/api/dashboard/pending`);
  }
}
