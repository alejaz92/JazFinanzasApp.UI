import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Tag } from '../models/tag.model';
import { TagAddRequest } from '../models/tag-addRequest.model';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class TagService {

  constructor(private http: HttpClient) { }

  getAllTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${environment.apiBaseURL}/api/tag`);
  }

  getTagById(id: number): Observable<Tag> {
    return this.http.get<Tag>(`${environment.apiBaseURL}/api/tag/${id}`);
  }

  addTag(model: TagAddRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/tag`, model);
  }

  updateTag(id: number, model: TagAddRequest): Observable<void> {
    return this.http.put<void>(`${environment.apiBaseURL}/api/tag/${id}`, model);
  }

  deleteTag(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/tag/${id}`);
  }

  getTagsForTransaction(transactionId: number): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${environment.apiBaseURL}/api/tag/transactions/${transactionId}`);
  }

  assignToTransaction(tagId: number, transactionId: number): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/tag/${tagId}/transactions/${transactionId}`, null);
  }

  unassignFromTransaction(tagId: number, transactionId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/tag/${tagId}/transactions/${transactionId}`);
  }

  getTagsForCardTransaction(cardTransactionId: number): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${environment.apiBaseURL}/api/tag/card-transactions/${cardTransactionId}`);
  }

  assignToCardTransaction(tagId: number, cardTransactionId: number): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/tag/${tagId}/card-transactions/${cardTransactionId}`, null);
  }

  unassignFromCardTransaction(tagId: number, cardTransactionId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/tag/${tagId}/card-transactions/${cardTransactionId}`);
  }
}
