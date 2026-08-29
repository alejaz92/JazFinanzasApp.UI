import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { Tag } from '../models/tag.model';
import { TagAddRequest } from '../models/tag-add-request.model';

@Injectable({
  providedIn: 'root'
})
export class TagService {

  constructor(private http: HttpClient) { }

  getAllTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${environment.apiBaseURL}/api/tag`);
  }

  createTag(model: TagAddRequest): Observable<Tag> {
    return this.http.post<Tag>(`${environment.apiBaseURL}/api/tag`, model);
  }

  updateTag(id: number, model: TagAddRequest): Observable<void> {
    return this.http.put<void>(`${environment.apiBaseURL}/api/tag/${id}`, model);
  }

  deleteTag(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/tag/${id}`);
  }

  assignToTransaction(tagId: number, transactionId: number): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/tag/${tagId}/transaction/${transactionId}`, {});
  }

  unassignFromTransaction(tagId: number, transactionId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/tag/${tagId}/transaction/${transactionId}`);
  }

  assignToCardTransaction(tagId: number, cardTransactionId: number): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/tag/${tagId}/cardTransaction/${cardTransactionId}`, {});
  }

  unassignFromCardTransaction(tagId: number, cardTransactionId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/tag/${tagId}/cardTransaction/${cardTransactionId}`);
  }

  getTagsForTransaction(transactionId: number): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${environment.apiBaseURL}/api/tag/transaction/${transactionId}`);
  }

  getTagsForCardTransaction(cardTransactionId: number): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${environment.apiBaseURL}/api/tag/cardTransaction/${cardTransactionId}`);
  }
}
