import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CryptoMovement } from '../models/CryptoMovement.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { CryptoMovementAdd } from '../models/CryptoMovementAdd.model';

@Injectable({
  providedIn: 'root'
})
export class CryptoMovementService {

  constructor(private http: HttpClient) { }

  getCryptoMovements(page: number, itemsPerPage: number): Observable<{ movements: CryptoMovement[], totalCount: number}> {
    return this.http.get<{ movements: CryptoMovement[], totalCount: number}>(`${environment.apiBaseURL}/api/CryptoMovement?page=${page}&itemsPerPage=${itemsPerPage}`);
  }

  createCryptoMovement(movement: CryptoMovementAdd): Observable<CryptoMovementAdd> {
    return this.http.post<CryptoMovementAdd>(`${environment.apiBaseURL}/api/CryptoMovement`, movement);
  }

  deleteCryptoMovement(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/CryptoMovement/${id}`);
  }

}
