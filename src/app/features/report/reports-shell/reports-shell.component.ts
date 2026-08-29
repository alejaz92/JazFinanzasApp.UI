import { Component } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ReportPeriodBarComponent } from '../shared/report-period-bar/report-period-bar.component';

interface NavLink {
    type: 'link';
    label: string;
    icon: string;
    route: string;
}

interface NavCategory {
    type: 'category';
    label: string;
    icon: string;
    // Recursivo: una categoría puede contener tanto links como sub-categorías
    // (ej. Inversiones > Carteras > General/Detalle) — Fase 4, docs/plans/activos/plan-rediseno-reportes.md.
    children: NavEntry[];
}

type NavEntry = NavLink | NavCategory;

// Las ocho categorías de la sección 4 del plan. Varias todavía no tienen ningún reporte
// propio (Panorama, Patrimonio, Compartidos, Retrospectiva: llegan en el Bloque D) — quedan
// declaradas igual, sin flecha ni contenido clickeable, para no tener que reestructurar el
// menú de nuevo en cada fase que agregue una categoría nueva.
const NAV_ENTRIES: NavEntry[] = [
    { type: 'category', label: 'Panorama', icon: 'bi-speedometer2', children: [] },
    { type: 'category', label: 'Patrimonio', icon: 'bi-wallet2', children: [] },
    {
        type: 'category', label: 'Ingresos y Egresos', icon: 'bi-graph-up-arrow',
        children: [
            { type: 'link', label: 'Resumen del mes', icon: 'bi-bar-chart', route: '/report/inc-exp' }
        ]
    },
    {
        type: 'category', label: 'Tarjetas', icon: 'bi-credit-card',
        children: [
            { type: 'link', label: 'General', icon: 'bi-grid-1x2', route: '/report/cards' }
        ]
    },
    {
        type: 'category', label: 'Inversiones', icon: 'bi-briefcase',
        children: [
            { type: 'link', label: 'Bolsa', icon: 'bi-bar-chart-line', route: '/report/stocks' },
            {
                type: 'category', label: 'Carteras', icon: 'bi-pie-chart',
                children: [
                    { type: 'link', label: 'General', icon: 'bi-grid-1x2', route: '/report/portfolio-general' },
                    { type: 'link', label: 'Detalle', icon: 'bi-list-ul', route: '/report/portfolio-detail' }
                ]
            },
            {
                type: 'category', label: 'Cryptos', icon: 'bi-currency-bitcoin',
                children: [
                    { type: 'link', label: 'General', icon: 'bi-grid-1x2', route: '/report/cryptos-gral' },
                    { type: 'link', label: 'Individual', icon: 'bi-coin', route: '/report/crypto' }
                ]
            }
        ]
    },
    {
        type: 'category', label: 'Viajes', icon: 'bi-airplane',
        children: [
            { type: 'link', label: 'General', icon: 'bi-grid-1x2', route: '/report/trips-general' },
            { type: 'link', label: 'Detalle', icon: 'bi-list-ul', route: '/report/trip-detail' }
        ]
    },
    { type: 'category', label: 'Compartidos', icon: 'bi-people', children: [] },
    { type: 'category', label: 'Retrospectiva', icon: 'bi-calendar3', children: [] }
];

@Component({
    selector: 'app-reports-shell',
    standalone: true,
    imports: [NgTemplateOutlet, RouterOutlet, RouterLink, RouterLinkActive, ReportPeriodBarComponent],
    templateUrl: './reports-shell.component.html',
    styleUrl: './reports-shell.component.scss'
})
export class ReportsShellComponent {
    sidebarOpen = false;

    // Categorías expandidas en el sidebar, por label. "Inversiones" arranca abierta porque
    // hoy agrupa la mayoría de los reportes existentes.
    private readonly expanded = new Set<string>(['Inversiones']);

    readonly navEntries: NavEntry[] = NAV_ENTRIES;

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    toggleCategory(label: string): void {
        if (this.expanded.has(label)) {
            this.expanded.delete(label);
        } else {
            this.expanded.add(label);
        }
    }

    isExpanded(label: string): boolean {
        return this.expanded.has(label);
    }

    isCategory(entry: NavEntry): entry is NavCategory {
        return entry.type === 'category';
    }

    closeSidebar(): void {
        this.sidebarOpen = false;
    }
}
