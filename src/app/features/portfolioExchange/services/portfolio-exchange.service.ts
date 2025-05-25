import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';

import { Observable } from 'rxjs';
import { CurrencyExchange } from '../../CurrencyExchange/models/CurrencyExchange.model';
import { PortfolioExchangeAdd } from '../models/PortfolioExchangeAdd.model';



@Injectable({
  providedIn: 'root'
})
export class PortfolioExchangeService {

  constructor(private http: HttpClient) { }

  getPortfolioExchanges(page: number, itemsPerPage: number) {
    return this.http.get<{transactionsDTO: CurrencyExchange[], totalCount: number}>(`${environment.apiBaseURL}/api/PortfolioTransaction?page=${page}&pageSize=${itemsPerPage}`);
  }
  
  createCurrencyExchange(portfolioExchange: PortfolioExchangeAdd): Observable<PortfolioExchangeAdd> {
    return this.http.post<PortfolioExchangeAdd>(`${environment.apiBaseURL}/api/PortfolioTransaction`, portfolioExchange);
  }

  // deleteCurrencyExchange(id: number): Observable<void> {
  //   return this.http.delete<void>(`${environment.apiBaseURL}/api/FiatCurrencyExchange/${id}`);
  // }

}
