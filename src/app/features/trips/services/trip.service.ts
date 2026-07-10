import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { Trip } from '../models/trip.model';
import { TripRequest } from '../models/trip-request.model';

@Injectable({
  providedIn: 'root'
})
export class TripService {

  constructor(private http: HttpClient) { }

  getAllTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${environment.apiBaseURL}/api/trip`);
  }

  getTripById(id: number): Observable<Trip> {
    return this.http.get<Trip>(`${environment.apiBaseURL}/api/trip/${id}`);
  }

  addTrip(model: TripRequest): Observable<Trip> {
    return this.http.post<Trip>(`${environment.apiBaseURL}/api/trip`, model);
  }

  updateTrip(id: number, model: TripRequest): Observable<void> {
    return this.http.put<void>(`${environment.apiBaseURL}/api/trip/${id}`, model);
  }

  deleteTrip(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/trip/${id}`);
  }
}
