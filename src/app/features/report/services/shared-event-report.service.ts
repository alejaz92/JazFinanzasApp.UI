import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { SharedEventGeneralReport, SharedEventPersonReport } from '../models/shared-event-report.model';

@Injectable({
  providedIn: 'root'
})
export class SharedEventReportService {

  constructor(private http: HttpClient) { }

  getGeneral(): Observable<SharedEventGeneralReport> {
    return this.http.get<SharedEventGeneralReport>(`${environment.apiBaseURL}/api/sharedeventreport/General`);
  }

  getByPerson(personId: number): Observable<SharedEventPersonReport> {
    return this.http.get<SharedEventPersonReport>(`${environment.apiBaseURL}/api/sharedeventreport/Person/${personId}`);
  }
}
