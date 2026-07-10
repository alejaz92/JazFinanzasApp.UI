import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

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
    children: NavLink[];
}

type NavEntry = NavLink | NavCategory;

@Component({
    selector: 'app-reports-shell',
    standalone: true,
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './reports-shell.component.html',
    styleUrl: './reports-shell.component.scss'
})
export class ReportsShellComponent {
    sidebarOpen = false;

    // categoría con subitems abierta en el sidebar (null = todas cerradas); "Carteras" arranca abierta
    // porque hoy es la única categoría con subitems.
    expandedCategory: string | null = 'Carteras';

    readonly navEntries: NavEntry[] = [
        { type: 'link', label: 'Ingresos y Egresos', icon: 'bi-graph-up-arrow', route: '/report/inc-exp' },
        { type: 'link', label: 'Tarjetas',           icon: 'bi-credit-card',    route: '/report/cards' },
        { type: 'link', label: 'Inv. Bolsa',         icon: 'bi-bar-chart-line', route: '/report/stocks' },
        { type: 'link', label: 'Cryptos General',    icon: 'bi-currency-bitcoin', route: '/report/cryptos-gral' },
        { type: 'link', label: 'Crypto Individual',  icon: 'bi-coin',           route: '/report/crypto' },
        {
            type: 'category', label: 'Carteras', icon: 'bi-briefcase',
            children: [
                { type: 'link', label: 'General', icon: 'bi-grid-1x2', route: '/report/portfolio-general' },
                { type: 'link', label: 'Detalle',  icon: 'bi-list-ul', route: '/report/portfolio-detail' }
            ]
        }
    ];

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    toggleCategory(label: string): void {
        this.expandedCategory = this.expandedCategory === label ? null : label;
    }

    isCategory(entry: NavEntry): entry is NavCategory {
        return entry.type === 'category';
    }
}
