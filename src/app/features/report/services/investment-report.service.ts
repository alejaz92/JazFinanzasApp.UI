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

  getStocks(assetId: number): Observable<StocksReport> {
    return this.http.get<StocksReport>(`${environment.apiBaseURL}/api/investmentreport/Stocks/${assetId}`);
  }

  getCryptoOverview(assetId: number, includeStables: boolean = true): Observable<CryptoOverviewReport> {
    return this.http.get<CryptoOverviewReport>(`${environment.apiBaseURL}/api/investmentreport/Crypto/${assetId}?includeStables=${includeStables}`);
  }

  getCryptoDetail(cryptoAssetId: number, assetId: number): Observable<CryptoDetailReport> {
    return this.http.get<CryptoDetailReport>(`${environment.apiBaseURL}/api/investmentreport/Crypto/${cryptoAssetId}/Detail/${assetId}`);
  }

  getContributionsVsPerformance(assetId: number): Observable<ContributionsVsPerformance> {
    return this.http.get<ContributionsVsPerformance>(`${environment.apiBaseURL}/api/investmentreport/ContributionsVsPerformance/${assetId}`);
  }
}
