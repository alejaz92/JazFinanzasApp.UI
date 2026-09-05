import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { CardService } from '../../card/services/card.service';
import { Card } from '../../card/models/card.model';
import { ReportContextService, PeriodPreset } from '../../../shared/services/report-context.service';

type CardFilterMode = 'none' | 'required' | 'optional';

interface NavLink {
    type: 'link';
    label: string;
    icon: string;
    route: string;
}

// Un nivel más de agrupación dentro de una categoría — hoy solo lo usa "Ingresos y Egresos"
// (corrección 2026-09-04: separar qué reportes son de ingresos, de egresos, o de ambos).
interface NavSubcategory {
    type: 'subcategory';
    label: string;
    icon: string;
    children: NavLink[];
}

interface NavCategory {
    type: 'category';
    label: string;
    icon: string;
    children: (NavLink | NavSubcategory)[];
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

    // subcategoría abierta dentro de la categoría expandida (ej. "Ingresos" o "Egresos" dentro de
    // "Ingresos y Egresos") — mismo criterio de a una por vez que expandedCategory.
    expandedSubcategory: string | null = null;

    private readonly assetService = inject(AssetService);
    private readonly cardService = inject(CardService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    protected readonly reportContext = inject(ReportContextService);

    readonly referenceAssets = signal<Asset[]>([]);
    readonly cards = signal<Card[]>([]);

    // Algunas pantallas (ej. Patrimonio) son una foto de hoy + una serie fija, no un rango elegible
    // — el propio hijo declara `data: { usesPeriod: false }` en report.routes.ts y el filtro se oculta.
    readonly usesPeriod = signal(true);

    // Corrección 2026-09-05: selector de tarjeta y toggle de recurrentes, antes sueltos dentro de
    // cada pantalla de Tarjetas — mismo criterio que usesPeriod, el hijo declara qué necesita en
    // report.routes.ts y esta barra se encarga de mostrarlo y de mantenerlo en la URL.
    readonly cardFilterMode = signal<CardFilterMode>('none');
    readonly showRecurringFilter = signal(false);

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
        {
            // Corrección 2026-09-04: "muchos reportes son de egresos y no se entiende que son
            // egresos" — los que involucran ambos (resumen, evolución) quedan sueltos acá; los que
            // son de un solo lado bajan un nivel más, agrupados por Ingresos / Egresos.
            type: 'category', label: 'Ingresos y Egresos', icon: 'bi-graph-up-arrow',
            children: [
                { type: 'link', label: 'Resumen del mes', icon: 'bi-bar-chart-steps', route: '/report/inc-exp-summary' },
                { type: 'link', label: 'Evolución y tendencia', icon: 'bi-graph-up', route: '/report/inc-exp-evolution' },
                {
                    type: 'subcategory', label: 'Ingresos', icon: 'bi-cash-coin',
                    children: [
                        { type: 'link', label: 'Composición y evolución', icon: 'bi-pie-chart', route: '/report/inc-income' },
                        { type: 'link', label: 'Días de cobro', icon: 'bi-calendar-check', route: '/report/inc-pay-days' }
                    ]
                },
                {
                    type: 'subcategory', label: 'Egresos', icon: 'bi-cash-stack',
                    children: [
                        { type: 'link', label: 'Por categoría', icon: 'bi-tags', route: '/report/inc-exp-by-category' },
                        { type: 'link', label: 'Por etiqueta', icon: 'bi-bookmark', route: '/report/inc-exp-by-tag' },
                        { type: 'link', label: 'Calendario de gastos', icon: 'bi-calendar3', route: '/report/inc-exp-calendar' }
                    ]
                }
            ]
        },
        {
            type: 'category', label: 'Tarjetas', icon: 'bi-credit-card',
            children: [
                { type: 'link', label: 'General', icon: 'bi-grid-1x2', route: '/report/cards-general' },
                { type: 'link', label: 'Por tarjeta', icon: 'bi-credit-card-2-front', route: '/report/cards-by-card' },
                { type: 'link', label: 'Compromiso futuro', icon: 'bi-calendar-range', route: '/report/cards-future-commitment' },
                { type: 'link', label: 'Promociones y reintegros', icon: 'bi-gift', route: '/report/cards-promotions' }
            ]
        },
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

        this.cardService.getAllCards().subscribe(cards => {
            this.cards.set(cards);
            this.ensureCardSelected();
        });

        this.updateRouteFlags();
        this.router.events
            .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
            .subscribe(() => {
                this.updateRouteFlags();
                this.ensureCardSelected();
            });
    }

    private updateRouteFlags(): void {
        const data = this.route.snapshot.firstChild?.data;
        this.usesPeriod.set(data?.['usesPeriod'] ?? true);
        this.cardFilterMode.set(data?.['cardFilter'] ?? 'none');
        this.showRecurringFilter.set(data?.['showRecurringFilter'] ?? false);
    }

    // Si la pantalla activa exige una tarjeta (cardFilter: 'required') y todavía no hay ninguna
    // elegida —o la de la URL ya no existe—, se cae a la primera. "optional" (Compromiso futuro)
    // no fuerza nada: sin selección ahí significa "todas".
    private ensureCardSelected(): void {
        if (this.cardFilterMode() !== 'required' || this.cards().length === 0) return;
        const current = this.reportContext.selectedCardId();
        const stillExists = current != null && this.cards().some(c => c.id === current);
        if (!stillExists) this.reportContext.setCardId(this.cards()[0].id);
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

    onCardFilterChange(cardId: number): void {
        this.reportContext.setCardId(cardId);
    }

    onIncludeRecurringChange(value: boolean): void {
        this.reportContext.setIncludeRecurring(value);
    }

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    toggleCategory(label: string): void {
        this.expandedCategory = this.expandedCategory === label ? null : label;
        this.expandedSubcategory = null;
    }

    toggleSubcategory(label: string): void {
        this.expandedSubcategory = this.expandedSubcategory === label ? null : label;
    }

    isCategory(entry: NavEntry): entry is NavCategory {
        return entry.type === 'category';
    }

    isSubcategory(child: NavLink | NavSubcategory): child is NavSubcategory {
        return child.type === 'subcategory';
    }
}
