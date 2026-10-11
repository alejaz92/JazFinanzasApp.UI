import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import {
    BondCollectionDismiss,
    BondCollectionListItem,
    BondCollectionPending,
    BondCollectionRegister
} from '../models/bondCollection.model';

@Injectable({
    providedIn: 'root'
})
export class BondCollectionService {

    private readonly baseUrl = `${environment.apiBaseURL}/api/bondcollection`;

    constructor(private http: HttpClient) { }

    getPending(): Observable<BondCollectionPending[]> {
        return this.http.get<BondCollectionPending[]>(`${this.baseUrl}/pending`);
    }

    getRegistered(): Observable<BondCollectionListItem[]> {
        return this.http.get<BondCollectionListItem[]>(this.baseUrl);
    }

    register(dto: BondCollectionRegister): Observable<number> {
        return this.http.post<number>(`${this.baseUrl}/register`, dto);
    }

    dismiss(dto: BondCollectionDismiss): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/dismiss`, dto);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
