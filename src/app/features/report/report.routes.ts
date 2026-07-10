import { Routes } from '@angular/router';
import { ReportsShellComponent } from './reports-shell/reports-shell.component';

export const reportRoutes: Routes = [
    {
        path: '',
        component: ReportsShellComponent,
        children: [
            { path: '', redirectTo: 'inc-exp', pathMatch: 'full' },
            {
                path: 'inc-exp',
                loadComponent: () => import('./inc-exp/inc-exp-report.component').then(m => m.IncExpReportComponent)
            },
            {
                path: 'cards',
                loadComponent: () => import('./cards-report/cards-report.component').then(m => m.CardsReportComponent)
            },
            {
                path: 'stocks',
                loadComponent: () => import('./stocks-report/stocks-report.component').then(m => m.StocksReportComponent)
            },
            {
                path: 'cryptos-gral',
                loadComponent: () => import('./cryptos-gral-report/cryptos-gral-report.component').then(m => m.CryptosGralReportComponent)
            },
            {
                path: 'crypto',
                loadComponent: () => import('./crypto-report/crypto-report.component').then(m => m.CryptoReportComponent)
            },
            {
                path: 'portfolio-general',
                loadComponent: () => import('./portfolio-general-report/portfolio-general-report.component').then(m => m.PortfolioGeneralReportComponent)
            },
            {
                path: 'portfolio-detail',
                loadComponent: () => import('./portfolio-report/portfolio-report.component').then(m => m.PortfolioReportComponent)
            },
            {
                path: 'trips-general',
                loadComponent: () => import('./trips-general-report/trips-general-report.component').then(m => m.TripsGeneralReportComponent)
            },
            {
                path: 'trip-detail',
                loadComponent: () => import('./trip-report/trip-report.component').then(m => m.TripReportComponent)
            }
        ]
    }
];
