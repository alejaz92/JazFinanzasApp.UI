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
                // Ingresos (corrección 2026-09-04 sobre la Fase 13) — composición de un mes elegido
                // + evolución por categoría como complemento secundario.
                path: 'inc-income',
                loadComponent: () => import('./inc-income/inc-income-report.component').then(m => m.IncIncomeReportComponent),
                data: { usesPeriod: false }
            },
            {
                // Días de cobro — se separó de "Ingresos" a pedido del usuario, con las 3 formas de
                // comparación (tabla/timeline/calendario) que se probaron ahí.
                path: 'inc-pay-days',
                loadComponent: () => import('./inc-pay-days/inc-pay-days-report.component').then(m => m.IncPayDaysReportComponent),
                data: { usesPeriod: false }
            },
            {
                // Tarjetas (Fase 15) — reemplaza a la vieja pantalla única "cards" (dada de baja),
                // ver Flujo 4 del plan.
                path: 'cards-general',
                loadComponent: () => import('./cards-general-report/cards-general-report.component').then(m => m.CardsGeneralReportComponent),
                data: { usesPeriod: false }
            },
            {
                // Corrección 2026-09-05: el selector de tarjeta pasa a la barra de filtros de la
                // sección (cardFilter: 'required' — esta pantalla no admite "todas").
                path: 'cards-by-card',
                loadComponent: () => import('./cards-by-card-report/cards-by-card-report.component').then(m => m.CardsByCardReportComponent),
                data: { usesPeriod: false, cardFilter: 'required' }
            },
            {
                // Corrección 2026-09-05: selector de tarjeta (opcional, admite "todas") y el toggle
                // de incluir recurrentes pasan a la barra de filtros de la sección.
                path: 'cards-future-commitment',
                loadComponent: () => import('./cards-future-commitment-report/cards-future-commitment-report.component').then(m => m.CardsFutureCommitmentReportComponent),
                data: { usesPeriod: false, cardFilter: 'optional', showRecurringFilter: true }
            },
            {
                path: 'cards-promotions',
                loadComponent: () => import('./cards-promotions-report/cards-promotions-report.component').then(m => m.CardsPromotionsReportComponent),
                data: { usesPeriod: false }
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
