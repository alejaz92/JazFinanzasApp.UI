import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';
import { CurrencyExchangeAdd } from '../models/CurrencyExchangeAdd.model';
import { Observable } from 'rxjs';
import { CurrencyExchange } from '../models/CurrencyExchange.model';

@Injectable({
  providedIn: 'root'
})
export class CurrencyExchangeService {

  constructor(private http: HttpClient) { }

  getCurrencyExchanges(page: number, itemsPerPage: number) {
    return this.http.get<{transactions: CurrencyExchange[], totalCount: number}>(`${environment.apiBaseURL}/api/FiatCurrencyExchange?page=${page}&itemsPerPage=${itemsPerPage}`);
  }
  
  createCurrencyExchange(currencyExchange: CurrencyExchangeAdd): Observable<CurrencyExchangeAdd> {
    return this.http.post<CurrencyExchangeAdd>(`${environment.apiBaseURL}/api/FiatCurrencyExchange`, currencyExchange);
  }

  deleteCurrencyExchange(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/FiatCurrencyExchange/${id}`);
  }

}
