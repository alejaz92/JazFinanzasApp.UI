import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Movement } from '../models/movement.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { MovementAdd } from '../models/movement-add.model';
import { MovementRefund } from '../models/movement-refund.model';

@Injectable({
  providedIn: 'root'
})
export class MovementService {

  constructor(private http: HttpClient) { }
  
  getMovements(page: number, itemsPerPage: number): Observable<{ movements: Movement[], totalCount: number}> {
    return this.http.get<{ movements: Movement[], totalCount: number}>(`${environment.apiBaseURL}/api/movement?page=${page}&itemsPerPage=${itemsPerPage}`);
  }
  createMovement(movement: MovementAdd): Observable<MovementAdd> {
    return this.http.post<MovementAdd>(`${environment.apiBaseURL}/api/movement`, movement);
  }
  deleteMovement(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/movement/${id}`);
  }
  getMovementById(id: number): Observable<Movement> {
    return this.http.get<Movement>(`${environment.apiBaseURL}/api/movement/${id}`);
  }
  updateMovement(id: number, movement: Movement): Observable<Movement> {
    return this.http.put<Movement>(`${environment.apiBaseURL}/api/movement/${id}`, movement);
  }

  refundMovement(id: number, refund: MovementRefund): Observable<MovementRefund> {
    return this.http.post<MovementRefund>(`${environment.apiBaseURL}/api/movement/refund/${id}`, refund);
  }

}
