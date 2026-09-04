import { Component, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import type { EChartsOption, ECElementEvent } from 'echarts';

import { IncomeExpenseService } from '../services/income-expense.service';
import { CategoryDetail, SpendingByCategory } from '../models/income-expense.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { TransactionService } from '../../transaction/services/transaction.service';
import { Transaction } from '../../transaction/models/transaction.model';

declare const bootstrap: any;

// Nodo de treemap: las hojas (categorías) llevan categoryId, los rubros (con children) no —
// eso es lo que distingue "hacer zoom" de "abrir el detalle" en el click handler.
interface TreemapNode {
    name: string;
    value: number;
    categoryId?: number;
    itemStyle?: { color: string };
    children?: TreemapNode[];
}

@Component({
    selector: 'app-inc-exp-by-category-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, DatePipe, CurrencyFiatFormatPipe, ChartComponent],
    templateUrl: './inc-exp-by-category-report.component.html',
    styleUrl: './inc-exp-by-category-report.component.css'
})
export class IncExpByCategoryReportComponent {
    private readonly incomeExpenseService = inject(IncomeExpenseService);
    private readonly transactionService = inject(TransactionService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = false;
    dataRequested = false;
    currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    data: SpendingByCategory | null = null;

    treemapOptions: EChartsOption = {};

    selectedCategory: CategoryDetail | null = null;
    categoryMovements: Transaction[] = [];
    isLoadingMovements = false;
    detailTrendOptions: EChartsOption = {};

    @ViewChild('drawerRef') private drawerRef?: ElementRef<HTMLElement>;
    private drawerInstance: any;

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) this.load(assetId);
        });
    }

    private load(assetId: number): void {
        this.isLoading = true;
        this.dataRequested = true;
        const monthParam = this.toMonthParam(this.currentMonth);
        this.incomeExpenseService.getByCategory(assetId, monthParam).subscribe(data => {
            this.data = data;
            this.isLoading = false;
            setTimeout(() => this.renderTreemap(), 0);
        });
    }

    previousMonth(): void {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
        const assetId = this.reportContext.currencyAssetId();
        if (assetId != null) this.load(assetId);
    }

    nextMonth(): void {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
        const assetId = this.reportContext.currencyAssetId();
        if (assetId != null) this.load(assetId);
    }

    get monthLabel(): string {
        return this.currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    }

    get allCategories(): CategoryDetail[] {
        return this.data?.groups.flatMap(g => g.categories) ?? [];
    }

    // El backend siempre devuelve una fila por categoría con gasto en los últimos 6 meses (para
    // poder armar la tendencia), aunque el mes pedido puntual esté en $0 — un treemap con todos
    // los valores en cero no tiene área para dibujar y queda en blanco, así que el estado vacío
    // se decide por el total del mes, no por si hay categorías en la lista.
    get hasSpend(): boolean {
        return this.allCategories.some(c => c.amount > 0);
    }

    // Clic en un bloque: abre el panel lateral con la tendencia y los movimientos de esa categoría.
    openCategory(category: CategoryDetail): void {
        this.selectedCategory = category;
        this.renderDetailTrend(category);
        this.loadMovements(category);
        this.openDrawer();
    }

    // El treemap no tiene lugar para una mini-tendencia por bloque — se muestra acá, en el
    // detalle, que es el momento en que de verdad importa mirarla.
    private renderDetailTrend(category: CategoryDetail): void {
        const months = category.monthlyTrend.length;
        const labels: string[] = [];
        for (let i = months - 1; i >= 0; i--) {
            const d = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - i, 1);
            labels.push(d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }));
        }
        this.detailTrendOptions = this.chartTheme.lineOptions(labels, category.monthlyTrend, {
            formatValue: (v: number) => this.formatMoney(v),
            colorIndex: 7,
        });
    }

    closeDetail(): void {
        this.selectedCategory = null;
        this.categoryMovements = [];
        this.drawerInstance?.hide();
    }

    private loadMovements(category: CategoryDetail): void {
        this.isLoadingMovements = true;
        const from = this.toMonthParam(this.currentMonth);
        const nextMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
        const to = this.toMonthParam(nextMonth);
        this.transactionService.getTransactions(1, 50, { classId: category.categoryId, from, to }).subscribe(res => {
            this.categoryMovements = res.transactions;
            this.isLoadingMovements = false;
        });
    }

    private openDrawer(): void {
        setTimeout(() => {
            const el = this.drawerRef?.nativeElement;
            if (!el) return;
            this.drawerInstance = bootstrap.Offcanvas.getOrCreateInstance(el);
            this.drawerInstance.show();
        });
    }

    private toMonthParam(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}-01`;
    }

    // Mismo criterio que currencyFiatFormat (siempre "$", sin depender de qué moneda esté elegida)
    // para que el número de cada bloque se lea como monto y no como una cantidad sin unidad.
    private formatMoney(v: number): string {
        return '$' + this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
    }

    // Nido rubro -> categorías (D-2): hoy cada rubro tiene una sola categoría adentro (ninguna
    // está clasificada todavía), así que se ve como bloques planos, pero el mecanismo ya soporta
    // "apertura al detalle" — clic en un rubro con varias categorías hace zoom, clic en una hoja abre el detalle.
    private renderTreemap(): void {
        if (!this.data) return;
        const data: TreemapNode[] = this.data.groups.map((g, i) => ({
            name: g.groupName,
            value: g.amount,
            itemStyle: { color: this.chartTheme.colorAt(i) },
            children: g.categories.map(c => ({ name: c.categoryName, value: c.amount, categoryId: c.categoryId })),
        }));

        this.treemapOptions = {
            tooltip: { ...this.chartTheme.tooltipDefaults(), formatter: (p: any) => `${p.name}: ${this.formatMoney(p.value)}` },
            series: [{
                type: 'treemap',
                roam: false,
                // Hoy cada rubro tiene una sola categoría adentro, así que nunca se ve nada acá —
                // pero el día que se clasifiquen categorías bajo un rubro (D-2), el clic en un rubro
                // hace zoom a sus hijas y esto es lo que deja volver al nivel de arriba.
                breadcrumb: { show: true, top: 'bottom', itemStyle: { color: this.chartTheme.surface.tooltipBg, borderColor: this.chartTheme.surface.axisLine, textStyle: { color: this.chartTheme.surface.axisLabel } } },
                label: { show: true, color: '#fff', fontWeight: 'bold', formatter: (p: any) => `${p.name}\n${this.formatMoney(p.value)}` },
                itemStyle: { borderColor: this.chartTheme.surface.tooltipBg, borderWidth: 2, gapWidth: 2 },
                data,
            }],
        };
    }

    onTreemapClick(event: ECElementEvent): void {
        const data = event.data as TreemapNode | undefined;
        if (!data || data.categoryId == null) return; // clic en un rubro (con hijos): deja que ECharts haga zoom
        const category = this.allCategories.find(c => c.categoryId === data.categoryId);
        if (category) this.openCategory(category);
    }
}
