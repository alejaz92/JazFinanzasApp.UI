import { Routes } from '@angular/router';
import { ReportsShellComponent } from './reports-shell/reports-shell.component';

export const reportRoutes: Routes = [
    {
        path: '',
        component: ReportsShellComponent,
        children: [
            { path: '', redirectTo: 'inc-exp', pathMatch: 'full' },
            {
                // Patrimonio es una foto de hoy + una serie fija de 12 meses, no un rango elegible —
                // el filtro de período de la barra de Reportes no le pega a ninguna de las 3 pantallas.
                path: 'networth-general',
                loadComponent: () => import('./net-worth-general-report/net-worth-general-report.component').then(m => m.NetWorthGeneralReportComponent),
                data: { usesPeriod: false }
            },
            {
                path: 'networth-by-account',
                loadComponent: () => import('./net-worth-by-account-report/net-worth-by-account-report.component').then(m => m.NetWorthByAccountReportComponent),
                data: { usesPeriod: false }
            },
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
