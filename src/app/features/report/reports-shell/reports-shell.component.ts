import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
    label: string;
    icon: string;
    route: string;
}

@Component({
    selector: 'app-reports-shell',
    standalone: true,
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './reports-shell.component.html',
    styleUrl: './reports-shell.component.scss'
})
export class ReportsShellComponent {
    sidebarOpen = false;

    readonly navItems: NavItem[] = [
        { label: 'Ingresos y Egresos', icon: 'bi-graph-up-arrow', route: '/report/inc-exp' },
        { label: 'Tarjetas',           icon: 'bi-credit-card',    route: '/report/cards' },
        { label: 'Inv. Bolsa',         icon: 'bi-bar-chart-line', route: '/report/stocks' },
        { label: 'Cryptos General',    icon: 'bi-currency-bitcoin', route: '/report/cryptos-gral' },
        { label: 'Crypto Individual',  icon: 'bi-coin',           route: '/report/crypto' },
    ];

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }
}
