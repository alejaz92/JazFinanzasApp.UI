import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AssetSplitEvent, AssetSplitEventAdd } from '../models/assetSplitEvent.model';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AssetSplitEventService {

  constructor(private http: HttpClient) { }

  getByAssetId(assetId: number): Observable<AssetSplitEvent[]> {
    return this.http.get<AssetSplitEvent[]>(`${environment.apiBaseURL}/api/assetsplitevent?assetId=${assetId}`);
  }

  add(dto: AssetSplitEventAdd): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseURL}/api/assetsplitevent`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseURL}/api/assetsplitevent/${id}`);
  }
}
