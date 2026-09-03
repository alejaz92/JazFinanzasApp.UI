import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
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
    imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
    templateUrl: './reports-shell.component.html',
    styleUrl: './reports-shell.component.scss'
})
export class ReportsShellComponent implements OnInit {
    sidebarOpen = false;

    // categoría con subitems abierta en el sidebar (null = todas cerradas); "Patrimonio" arranca
    // abierta por ser la primera y la de uso más frecuente (Flujo 2 del plan).
    expandedCategory: string | null = 'Patrimonio';

    private readonly assetService = inject(AssetService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    protected readonly reportContext = inject(ReportContextService);

    readonly referenceAssets = signal<Asset[]>([]);

    // Algunas pantallas (ej. Patrimonio) son una foto de hoy + una serie fija, no un rango elegible
    // — el propio hijo declara `data: { usesPeriod: false }` en report.routes.ts y el filtro se oculta.
    readonly usesPeriod = signal(true);

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
        {
            type: 'category', label: 'Patrimonio', icon: 'bi-piggy-bank',
            children: [
                { type: 'link', label: 'General', icon: 'bi-grid-1x2', route: '/report/networth-general' },
                { type: 'link', label: 'Por cuenta', icon: 'bi-bank', route: '/report/networth-by-account' },
                { type: 'link', label: 'Por activo', icon: 'bi-currency-exchange', route: '/report/networth-by-asset' }
            ]
        },
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

        this.updateUsesPeriod();
        this.router.events
            .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
            .subscribe(() => this.updateUsesPeriod());
    }

    private updateUsesPeriod(): void {
        this.usesPeriod.set(this.route.snapshot.firstChild?.data?.['usesPeriod'] ?? true);
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

    onCurrencyChange(assetId: number): void {
        this.reportContext.setCurrency(assetId);
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
