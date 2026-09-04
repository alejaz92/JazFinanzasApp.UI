import { Routes } from '@angular/router';
import { ReportsShellComponent } from './reports-shell/reports-shell.component';

export const reportRoutes: Routes = [
    {
        path: '',
        component: ReportsShellComponent,
        children: [
            { path: '', redirectTo: 'inc-exp-summary', pathMatch: 'full' },
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
                path: 'networth-by-asset',
                loadComponent: () => import('./net-worth-by-asset-report/net-worth-by-asset-report.component').then(m => m.NetWorthByAssetReportComponent),
                data: { usesPeriod: false }
            },
            {
                // Ingresos y Egresos (Fase 13) — cada pantalla maneja su propio mes/año/ventana,
                // no el filtro de período compartido de la barra de Reportes (mismo criterio que Patrimonio).
                path: 'inc-exp-summary',
                loadComponent: () => import('./inc-exp-summary/inc-exp-summary-report.component').then(m => m.IncExpSummaryReportComponent),
                data: { usesPeriod: false }
            },
            {
                path: 'inc-exp-evolution',
                loadComponent: () => import('./inc-exp-evolution/inc-exp-evolution-report.component').then(m => m.IncExpEvolutionReportComponent),
                data: { usesPeriod: false }
            },
            {
                path: 'inc-exp-by-category',
                loadComponent: () => import('./inc-exp-by-category/inc-exp-by-category-report.component').then(m => m.IncExpByCategoryReportComponent),
                data: { usesPeriod: false }
            },
            {
                path: 'inc-exp-by-tag',
                loadComponent: () => import('./inc-exp-by-tag/inc-exp-by-tag-report.component').then(m => m.IncExpByTagReportComponent),
                data: { usesPeriod: false }
            },
            {
                path: 'inc-exp-calendar',
                loadComponent: () => import('./inc-exp-calendar/inc-exp-calendar-report.component').then(m => m.IncExpCalendarReportComponent),
                data: { usesPeriod: false }
            },
            {
                // Ingresos (corrección 2026-09-04 sobre la Fase 13) — evolución por categoría en el
                // tiempo, en vez de una composición de un mes (sueldo domina cualquier foto puntual).
                path: 'inc-income',
                loadComponent: () => import('./inc-income/inc-income-report.component').then(m => m.IncIncomeReportComponent),
                data: { usesPeriod: false }
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
