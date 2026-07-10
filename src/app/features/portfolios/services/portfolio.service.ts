import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Portfolio } from '../models/portfolio.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { PortfolioAddRequest } from '../models/portfolio-add-request.model';
import { PortfolioStatsDTO, PortfolioDetailStatsDTO } from '../models/portfolio-stats.model';

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

    // valor actual/original de cada cartera del usuario (docs/plans/activos/portfolios-estadisticas.md)
    getPortfolioStats(): Observable<PortfolioStatsDTO[]> {
      return this.http.get<PortfolioStatsDTO[]>(`${environment.apiBaseURL}/api/report/PortfolioStats`);
    }

    // composición y holdings (desagregados por cuenta) de una cartera puntual
    getPortfolioDetailStats(portfolioId: number): Observable<PortfolioDetailStatsDTO> {
      return this.http.get<PortfolioDetailStatsDTO>(`${environment.apiBaseURL}/api/report/PortfolioStats/${portfolioId}`);
    }
}
