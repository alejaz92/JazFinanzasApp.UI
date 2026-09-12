import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { TripGeneralReport, TripDetailReport } from '../models/trip-report.model';

@Injectable({
  providedIn: 'root'
})
export class TripReportService {

  constructor(private http: HttpClient) { }

  getGeneral(assetId: number): Observable<TripGeneralReport[]> {
    return this.http.get<TripGeneralReport[]>(`${environment.apiBaseURL}/api/tripreport/General/${assetId}`);
  }

  getDetail(tripId: number, assetId: number): Observable<TripDetailReport> {
    return this.http.get<TripDetailReport>(`${environment.apiBaseURL}/api/tripreport/${tripId}/Detail/${assetId}`);
  }
}
