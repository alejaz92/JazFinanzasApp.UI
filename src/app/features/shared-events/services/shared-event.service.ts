import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import {
  SharedEventListItem,
  SharedEventDetail,
  SharedEventAddRequest,
  SharedEventEditRequest,
  SharedEventParticipantAddRequest,
  SharedEventMovementAddRequest,
  SharedEventMovement,
  SharedEventActiveSummary,
  SharedEventConsolidatedDebt
} from '../models/shared-event.model';

@Injectable({
  providedIn: 'root'
})
export class SharedEventService {

  constructor(private http: HttpClient) { }

  getAll(includeClosed: boolean = false): Observable<SharedEventListItem[]> {
    return this.http.get<SharedEventListItem[]>(`${environment.apiBaseURL}/api/shared-event?includeClosed=${includeClosed}`);
  }

  getById(id: number): Observable<SharedEventDetail> {
    return this.http.get<SharedEventDetail>(`${environment.apiBaseURL}/api/shared-event/${id}`);
  }

  create(model: SharedEventAddRequest): Observable<SharedEventDetail> {
    return this.http.post<SharedEventDetail>(`${environment.apiBaseURL}/api/shared-event`, model);
  }

  update(id: number, model: SharedEventEditRequest): Observable<void> {
    return this.http.put<void>(`${environment.apiBaseURL}/api/shared-event/${id}`, model);
  }

  addParticipant(id: number, model: SharedEventParticipantAddRequest): Observable<SharedEventDetail> {
    return this.http.post<SharedEventDetail>(`${environment.apiBaseURL}/api/shared-event/${id}/participants`, model);
  }

  removeParticipant(id: number, personId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/shared-event/${id}/participants/${personId}`);
  }

  close(id: number): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/shared-event/${id}/close`, {});
  }

  reopen(id: number): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/shared-event/${id}/reopen`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/shared-event/${id}`);
  }

  addMovement(id: number, model: SharedEventMovementAddRequest): Observable<SharedEventMovement> {
    return this.http.post<SharedEventMovement>(`${environment.apiBaseURL}/api/shared-event/${id}/movements`, model);
  }

  updateMovement(id: number, movementId: number, model: SharedEventMovementAddRequest): Observable<SharedEventMovement> {
    return this.http.put<SharedEventMovement>(`${environment.apiBaseURL}/api/shared-event/${id}/movements/${movementId}`, model);
  }

  deleteMovement(id: number, movementId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/shared-event/${id}/movements/${movementId}`);
  }

  getActiveSummary(): Observable<SharedEventActiveSummary[]> {
    return this.http.get<SharedEventActiveSummary[]>(`${environment.apiBaseURL}/api/shared-event/active-summary`);
  }

  getConsolidatedDebts(): Observable<SharedEventConsolidatedDebt[]> {
    return this.http.get<SharedEventConsolidatedDebt[]>(`${environment.apiBaseURL}/api/shared-event/consolidated-debts`);
  }
}
