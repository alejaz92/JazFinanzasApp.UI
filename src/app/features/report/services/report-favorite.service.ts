import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { ReportFavorite } from '../models/report-favorite.model';

@Injectable({
  providedIn: 'root'
})
export class ReportFavoriteService {

  constructor(private http: HttpClient) { }

  getAll(): Observable<ReportFavorite[]> {
    return this.http.get<ReportFavorite[]>(`${environment.apiBaseURL}/api/reportfavorite`);
  }

  create(reportKey: string): Observable<ReportFavorite> {
    return this.http.post<ReportFavorite>(`${environment.apiBaseURL}/api/reportfavorite`, { reportKey });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/reportfavorite/${id}`);
  }

  reorder(orderedIds: number[]): Observable<void> {
    return this.http.put<void>(`${environment.apiBaseURL}/api/reportfavorite/reorder`, orderedIds);
  }
}
