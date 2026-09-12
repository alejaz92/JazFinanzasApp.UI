import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import {
    InvestmentOverview,
    PortfoliosOverview,
    PortfolioDetailReport,
    StocksReport,
    CryptoOverviewReport,
    CryptoDetailReport,
    AssetDetailReport,
    ContributionsVsPerformance
} from '../models/investment-report.model';

@Injectable({
  providedIn: 'root'
})
export class InvestmentReportService {

  constructor(private http: HttpClient) { }

  getOverview(assetId: number): Observable<InvestmentOverview> {
    return this.http.get<InvestmentOverview>(`${environment.apiBaseURL}/api/investmentreport/Overview/${assetId}`);
  }

  getPortfoliosOverview(assetId: number, includeCash: boolean = true): Observable<PortfoliosOverview> {
    return this.http.get<PortfoliosOverview>(`${environment.apiBaseURL}/api/investmentreport/Portfolios/${assetId}?includeCash=${includeCash}`);
  }

  getPortfolioDetail(portfolioId: number, assetId: number, includeCash: boolean = true): Observable<PortfolioDetailReport> {
    return this.http.get<PortfolioDetailReport>(`${environment.apiBaseURL}/api/investmentreport/Portfolios/${portfolioId}/Detail/${assetId}?includeCash=${includeCash}`);
  }

  // assetTypeId en 0 (default) trae todo el entorno (D-11); includeClosed suma las posiciones ya
  // vendidas del todo, apagado por default (D-14).
  getStocks(assetId: number, assetTypeId: number = 0, includeClosed: boolean = false): Observable<StocksReport> {
    return this.http.get<StocksReport>(`${environment.apiBaseURL}/api/investmentreport/Stocks/${assetId}?assetTypeId=${assetTypeId}&includeClosed=${includeClosed}`);
  }

  getCryptoOverview(assetId: number, includeStables: boolean = true): Observable<CryptoOverviewReport> {
    return this.http.get<CryptoOverviewReport>(`${environment.apiBaseURL}/api/investmentreport/Crypto/${assetId}?includeStables=${includeStables}`);
  }

  getCryptoDetail(cryptoAssetId: number, assetId: number): Observable<CryptoDetailReport> {
    return this.http.get<CryptoDetailReport>(`${environment.apiBaseURL}/api/investmentreport/Crypto/${cryptoAssetId}/Detail/${assetId}`);
  }

  // Detalle de un activo (T17, revisión de Bolsa 2026-09-12): generaliza la ruta de arriba —
  // Bolsa — Detalle la usa, Cryptos — Detalle sigue en la ruta vieja (mismo cálculo del lado del
  // backend, sin romper contrato mientras esa pantalla no migre).
  getAssetDetail(assetId: number, referenceAssetId: number): Observable<AssetDetailReport> {
    return this.http.get<AssetDetailReport>(`${environment.apiBaseURL}/api/investmentreport/Asset/${assetId}/Detail/${referenceAssetId}`);
  }

  getContributionsVsPerformance(assetId: number): Observable<ContributionsVsPerformance> {
    return this.http.get<ContributionsVsPerformance>(`${environment.apiBaseURL}/api/investmentreport/ContributionsVsPerformance/${assetId}`);
  }
}
