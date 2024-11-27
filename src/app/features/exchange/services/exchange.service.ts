import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';
import { Exchange } from '../models/Exchange.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExchangeService {

  constructor(private http: HttpClient) { }

  getExchanges(page: number, itemsPerPage: number) {
    return this.http.get<{transactions: Exchange[], totalCount: number}>(`${environment.apiBaseURL}/api/Transaction/exchange?page=${page}&pageSize=${itemsPerPage}`);
  }

  deleteExchange(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/Transaction/exchange/${id}`);

    
  }

}
