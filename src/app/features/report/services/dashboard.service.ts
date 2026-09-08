import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { Dashboard } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private http: HttpClient) { }

  getDashboard(assetId: number): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${environment.apiBaseURL}/api/dashboard/${assetId}`);
  }
}
