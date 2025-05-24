import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Portfolio } from '../models/portfolio.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { PortfolioAddRequest } from '../models/portfolio-add-request.model';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  constructor(private http: HttpClient) { }

  getAllPortfolios(): Observable<Portfolio[]> {
      return this.http.get<Portfolio[]>(`${environment.apiBaseURL}/api/Portfolio`);
  
    }
    deletePortfolio(id: number): Observable<Portfolio[]> {
      return this.http.delete<Portfolio[]>(`${environment.apiBaseURL}/api/Portfolio/${id}`);
    }
    addPortfolio(model: PortfolioAddRequest): Observable<void> {
      return this.http.post<void>(`${environment.apiBaseURL}/api/Portfolio`, model);
    }  
    getPortfolioById(id: number): Observable<Portfolio> {
      return this.http.get<Portfolio>(`${environment.apiBaseURL}/api/Portfolio/${id}`);
    }
    updatePortfolio(id: number, Portfolio: PortfolioAddRequest): Observable<Portfolio> {
      return this.http.put<Portfolio>(`${environment.apiBaseURL}/api/Portfolio/${id}`, Portfolio);
    }

    // get default portfolio
    getDefaultPortfolio(): Observable<Portfolio> {
      return this.http.get<Portfolio>(`${environment.apiBaseURL}/api/Portfolio/default`);
    }
}
