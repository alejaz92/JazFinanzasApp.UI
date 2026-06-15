import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { Person } from '../models/person.model';
import { PersonAddRequest } from '../models/person-add-request.model';

@Injectable({
  providedIn: 'root'
})
export class PersonService {

  constructor(private http: HttpClient) { }

  getAllPeople(): Observable<Person[]> {
    return this.http.get<Person[]>(`${environment.apiBaseURL}/api/person`);
  }

  getPersonById(id: number): Observable<Person> {
    return this.http.get<Person>(`${environment.apiBaseURL}/api/person/${id}`);
  }

  addPerson(model: PersonAddRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/person`, model);
  }

  updatePerson(id: number, model: PersonAddRequest): Observable<Person> {
    return this.http.put<Person>(`${environment.apiBaseURL}/api/person/${id}`, model);
  }

  deletePerson(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/person/${id}`);
  }
}
