import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { ReportContextService, PeriodPreset } from '../../../shared/services/report-context.service';

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
export class ReportsShellComponent implements OnInit {
    sidebarOpen = false;

    // categoría con subitems abierta en el sidebar (null = todas cerradas); "Carteras" arranca abierta
    // porque hoy es la única categoría con subitems.
    expandedCategory: string | null = 'Carteras';

    private readonly assetService = inject(AssetService);
    protected readonly reportContext = inject(ReportContextService);

    readonly referenceAssets = signal<Asset[]>([]);

    readonly periodOptions: { value: PeriodPreset; label: string }[] = [
        { value: 'this-month', label: 'Este mes' },
        { value: 'last-month', label: 'Mes pasado' },
        { value: 'last-12-months', label: 'Últimos 12 meses' },
        { value: 'this-year', label: 'Este año' },
        { value: 'last-year', label: 'Año pasado' },
        { value: 'all', label: 'Todo' },
        { value: 'custom', label: 'Rango' },
    ];

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
        },
        {
            type: 'category', label: 'Viajes', icon: 'bi-airplane',
            children: [
                { type: 'link', label: 'General', icon: 'bi-grid-1x2', route: '/report/trips-general' },
                { type: 'link', label: 'Detalle',  icon: 'bi-list-ul', route: '/report/trip-detail' }
            ]
        }
    ];

    ngOnInit(): void {
        this.assetService.getReferenceAssets().subscribe(assets => {
            this.referenceAssets.set(assets);
            if (this.reportContext.currencyAssetId() == null) {
                const main = assets.find(a => a.isMainReference) ?? assets[0];
                if (main) this.reportContext.setCurrency(main.id);
            }
        });
    }

    onPeriodChange(preset: PeriodPreset): void {
        if (preset === 'custom') {
            const current = this.reportContext.period();
            this.reportContext.setPeriod('custom', { from: current.from ?? '', to: current.to ?? '' });
        } else {
            this.reportContext.setPeriod(preset);
        }
    }

    onCustomFromChange(event: Event): void {
        const from = (event.target as HTMLInputElement).value;
        const to = this.reportContext.period().to ?? '';
        this.reportContext.setPeriod('custom', { from, to });
    }

    onCustomToChange(event: Event): void {
        const to = (event.target as HTMLInputElement).value;
        const from = this.reportContext.period().from ?? '';
        this.reportContext.setPeriod('custom', { from, to });
    }

    onCurrencyChange(event: Event): void {
        const value = Number((event.target as HTMLSelectElement).value);
        if (!Number.isNaN(value)) this.reportContext.setCurrency(value);
    }

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
