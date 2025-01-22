import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { Asset } from '../models/asset.model';

@Injectable({
  providedIn: 'root'
})
export class AssetService {


  constructor(private http: HttpClient) { }


  // ver de  mover a un servicio de assetType
  getAssetTypes() : Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiBaseURL}/api/asset/type`);
  }
  getAvailableAssets(typeId: number) : Observable<Asset[]> {
    return this.http.get<Asset[]>(`${environment.apiBaseURL}/api/asset/type/${typeId}`);
  }
  getAssignedAssets(typeId: number) : Observable<Asset[]> {
    return this.http.get<Asset[]>(`${environment.apiBaseURL}/api/asset/user-assets/${typeId}`);
  }

  assignAsset(assetId: number): Observable<any> {
    return this.http.post(`${environment.apiBaseURL}/api/asset/assign-asset/`, assetId);
  }

  unassignAsset(assetId: number): Observable<any> {
    return this.http.post(`${environment.apiBaseURL}/api/asset/unassign-asset/`, assetId);
  }

  // checkAssetUsage(assetId: number): Observable<boolean> {

  //   //luego arreglar para que haga el chequeo
  //   //return this.http.get<boolean>(`${environment.apiBaseURL}/api/asset/check-usage/${assetId}`);
  //   return new Observable<boolean>(observer => {
  //     observer.next(true);
  //     observer.complete();
  //   });
  // }

  
  getAssetsByTypeName(typeName: string): Observable<Asset[]> {
    return this.http.get<Asset[]>(`${environment.apiBaseURL}/api/asset/user-assetsByName/${typeName}`);
  }

  getCardAssets(): Observable<Asset[]> {
    return this.http.get<Asset[]>(`${environment.apiBaseURL}/api/asset/card`);
  }

  updateReference(asset: Asset): Observable<any> {
    return this.http.put(`${environment.apiBaseURL}/api/asset/updateReference`, asset);
  }

  getReferenceAssets(): Observable<Asset[]> {
    return this.http.get<Asset[]>(`${environment.apiBaseURL}/api/asset/reference`);
  }
  
}
