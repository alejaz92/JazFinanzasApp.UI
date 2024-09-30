import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MovementClass } from '../models/movementClass.model';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class MovementClassService {

  constructor(private http: HttpClient) { }

  getAllMovementClasses(): Observable<MovementClass[]> {
    return this.http.get<MovementClass[]>(`${environment.apiBaseURL}/api/movementClass/test`);
  }
}
