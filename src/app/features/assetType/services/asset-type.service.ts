import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AssetTypeService {

  constructor(private http: HttpClient) { }


  // get asset types by environment parameter
  getAssetTypes(env: string): Observable<any> {
    return this.http.get<any>(`${environment.apiBaseURL}/api/assetType?environment=${env}`);
  }
  
}
