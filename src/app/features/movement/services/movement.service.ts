import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Movement } from '../models/movement.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class MovementService {

  constructor(private http: HttpClient) { }
  
  getMovements(page: number, itemsPerPage: number): Observable<{ movements: Movement[], totalCount: number}> {
    return this.http.get<{ movements: Movement[], totalCount: number}>(`${environment.apiBaseURL}/api/movement?page=${page}&itemsPerPage=${itemsPerPage}`);
  }
}
