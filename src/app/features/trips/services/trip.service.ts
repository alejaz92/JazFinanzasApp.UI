import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { Trip } from '../models/trip.model';
import { TripRequest } from '../models/trip-request.model';
import { TripDetail } from '../models/trip-detail.model';
import { TripMovement, TripMovementRef } from '../models/trip-movement.model';

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

  getTripDetail(id: number): Observable<TripDetail> {
    return this.http.get<TripDetail>(`${environment.apiBaseURL}/api/trip/${id}`);
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

  getSuggestions(tripId: number): Observable<TripMovement[]> {
    return this.http.get<TripMovement[]>(`${environment.apiBaseURL}/api/trip/${tripId}/suggestions`);
  }

  searchCandidates(tripId: number, search: string): Observable<TripMovement[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<TripMovement[]>(`${environment.apiBaseURL}/api/trip/${tripId}/candidates${query}`);
  }

  associateMovements(tripId: number, movements: TripMovementRef[]): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/trip/${tripId}/associations`, { movements });
  }

  disassociateMovements(tripId: number, movements: TripMovementRef[]): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/trip/${tripId}/associations`, { body: { movements } });
  }

  dismissSuggestion(tripId: number, movement: TripMovementRef): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/trip/${tripId}/dismissals`, movement);
  }
}
