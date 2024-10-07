import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountAssetType } from '../../models/account_assetType.model';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AccountAssetTypeService {



  constructor(private http: HttpClient) { }

  getAssetTypes(accountId: number): Observable<AccountAssetType[]> {
    return this.http.get<AccountAssetType[]>(`${environment.apiBaseURL}/api/Account_AssetType/${accountId}`);
  }
}
