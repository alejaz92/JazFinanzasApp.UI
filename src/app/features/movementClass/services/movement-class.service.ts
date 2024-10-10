import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MovementClass } from '../models/movementClass.model';
import { environment } from 'src/environments/environment.development';
import { MovementClassAddRequest } from '../models/movementClass-addRequest.model';



@Injectable({
  providedIn: 'root'
})
export class MovementClassService {

  constructor(private http: HttpClient) { }

  getAllMovementClasses(): Observable<MovementClass[]> {
    return this.http.get<MovementClass[]>(`${environment.apiBaseURL}/api/movementClass`);
  }

  getMovementClassById(id: number): Observable<MovementClass> {
    return this.http.get<MovementClass>(`${environment.apiBaseURL}/api/movementClass/${id}`);
  }

  addMovementClass(model: MovementClassAddRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/movementClass`, model);
  }

  updateMovementClass(id: number, movementClass: MovementClass): Observable<MovementClass> {
    return this.http.put<MovementClass>(`${environment.apiBaseURL}/api/movementClass/${id}`, movementClass);
  }

  deleteMovementClass(id: number): Observable<MovementClass> {
    return this.http.delete<MovementClass>(`${environment.apiBaseURL}/api/movementClass/${id}`);
  }
}
