import { Component, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { NgIf, NgFor, NgClass, NgTemplateOutlet, DecimalPipe, DatePipe } from '@angular/common';
import type { EChartsOption, ECElementEvent } from 'echarts';

import { IncomeExpenseService } from '../services/income-expense.service';
import { CategoryDetail, CategoryGroup, SpendingByCategory } from '../models/income-expense.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { TransactionService } from '../../transaction/services/transaction.service';
import { Transaction } from '../../transaction/models/transaction.model';

declare const bootstrap: any;

type LayoutMode = 'treemap' | 'bars' | 'cards' | 'table';
type DrilldownMode = 'drawer' | 'modal' | 'inline';

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
    imports: [LoadingComponent, NgIf, NgFor, NgClass, NgTemplateOutlet, DecimalPipe, DatePipe, CurrencyFiatFormatPipe, ChartComponent],
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

    // Comparación de opciones a pedido del usuario (2026-09-04) — dos selectores independientes,
    // toda combinación usa los mismos datos ya traídos. Una vez elegida la definitiva, se sacan
    // los otros tres layouts y los otros dos modos de detalle, y este comentario también.
    layoutMode: LayoutMode = 'table';
    readonly layoutOptions: { value: LayoutMode; label: string }[] = [
        { value: 'treemap', label: 'Mapa de bloques' },
        { value: 'bars', label: 'Barras rankeadas' },
        { value: 'cards', label: 'Tarjetas' },
        { value: 'table', label: 'Tabla (actual)' },
    ];

    drilldownMode: DrilldownMode = 'drawer';
    readonly drilldownOptions: { value: DrilldownMode; label: string }[] = [
        { value: 'drawer', label: 'Panel lateral' },
        { value: 'modal', label: 'Modal' },
        { value: 'inline', label: 'Expandir en el lugar' },
    ];

    sparklineByCategory: Record<number, EChartsOption> = {};
    treemapOptions: EChartsOption = {};
    barsOptions: EChartsOption = {};
    private barCategories: CategoryDetail[] = [];

    selectedCategory: CategoryDetail | null = null;
    categoryMovements: Transaction[] = [];
    isLoadingMovements = false;

    @ViewChild('drawerRef') private drawerRef?: ElementRef<HTMLElement>;
    @ViewChild('modalRef') private modalRef?: ElementRef<HTMLElement>;
    private drawerInstance: any;
    private modalInstance: any;

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
            setTimeout(() => this.renderCharts(), 0);
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

    setLayout(mode: LayoutMode): void {
        this.layoutMode = mode;
        setTimeout(() => this.renderCharts(), 0);
    }

    setDrilldown(mode: DrilldownMode): void {
        this.drilldownMode = mode;
        this.closeDetail();
    }

    get monthLabel(): string {
        return this.currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    }

    get totalAmount(): number {
        return this.data?.groups.reduce((sum, g) => sum + g.amount, 0) ?? 0;
    }

    get allCategories(): CategoryDetail[] {
        return this.data?.groups.flatMap(g => g.categories) ?? [];
    }

    get barsHeight(): number {
        return Math.max(240, this.allCategories.length * 36);
    }

    groupPct(group: CategoryGroup): number {
        return this.totalAmount > 0 ? (group.amount / this.totalAmount) * 100 : 0;
    }

    categoryPct(category: CategoryDetail): number {
        const max = Math.max(...this.allCategories.map(c => c.amount), 1);
        return (category.amount / max) * 100;
    }

    rankDelta(category: CategoryDetail): number | null {
        if (category.rankPrevious == null) return null;
        return category.rankPrevious - category.rankCurrent;
    }

    // Reemplaza la redirección a /transactions (Fase 13) que no le gustó al usuario: ahora todo
    // pasa por acá, y el modo (panel/modal/inline) decide solo cómo se muestra, no de dónde sale el dato.
    openCategory(category: CategoryDetail): void {
        this.selectedCategory = category;
        this.loadMovements(category);
        if (this.drilldownMode === 'drawer') this.openDrawer();
        if (this.drilldownMode === 'modal') this.openModal();
    }

    closeDetail(): void {
        this.selectedCategory = null;
        this.categoryMovements = [];
        this.drawerInstance?.hide();
        this.modalInstance?.hide();
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

    private openModal(): void {
        setTimeout(() => {
            const el = this.modalRef?.nativeElement;
            if (!el) return;
            this.modalInstance = bootstrap.Modal.getOrCreateInstance(el);
            this.modalInstance.show();
        });
    }

    private toMonthParam(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}-01`;
    }

    private renderCharts(): void {
        if (!this.data) return;
        this.renderSparklines();
        if (this.layoutMode === 'treemap') this.renderTreemap();
        if (this.layoutMode === 'bars') this.renderBars();
    }

    private renderSparklines(): void {
        if (!this.data) return;
        const color = this.chartTheme.colorAt(7);
        for (const group of this.data.groups) {
            for (const category of group.categories) {
                this.sparklineByCategory[category.categoryId] = {
                    grid: { left: 0, right: 0, top: 4, bottom: 4 },
                    xAxis: { type: 'category', show: false, data: category.monthlyTrend.map((_, i) => i) },
                    yAxis: { type: 'value', show: false },
                    series: [{ type: 'line', data: category.monthlyTrend, showSymbol: false, lineStyle: { width: 1.5, color } }],
                };
            }
        }
    }

    // Nido rubro -> categorías (D-2): hoy cada rubro tiene una sola categoría adentro (ninguna
    // está clasificada todavía), así que se ve como bloques planos, pero el mecanismo ya soporta
    // "apertura al detalle" — clic en un rubro con varias categorías hace zoom, clic en una hoja abre el detalle.
    private renderTreemap(): void {
        if (!this.data) return;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        const data: TreemapNode[] = this.data.groups.map((g, i) => ({
            name: g.groupName,
            value: g.amount,
            itemStyle: { color: this.chartTheme.colorAt(i) },
            children: g.categories.map(c => ({ name: c.categoryName, value: c.amount, categoryId: c.categoryId })),
        }));

        this.treemapOptions = {
            tooltip: { ...this.chartTheme.tooltipDefaults(), formatter: (p: any) => `${p.name}: ${fmt(p.value)}` },
            series: [{
                type: 'treemap',
                roam: false,
                breadcrumb: { show: false },
                label: { show: true, color: '#fff', fontWeight: 'bold', formatter: (p: any) => `${p.name}\n${fmt(p.value)}` },
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

    // Ranking aplanado (sin agrupar por rubro) — la comparación que pidió el usuario en vez de la
    // tabla larga por rubro.
    private renderBars(): void {
        if (!this.data) return;
        this.barCategories = [...this.allCategories].sort((a, b) => b.amount - a.amount);
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        this.barsOptions = {
            grid: { left: 150, right: 30, top: 10, bottom: 20 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            yAxis: { type: 'category', inverse: true, data: this.barCategories.map(c => c.categoryName), axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            series: [{ type: 'bar', data: this.barCategories.map(c => c.amount), itemStyle: { color: (p: any) => this.chartTheme.colorAt(p.dataIndex) } }],
        };
    }

    onBarsClick(event: ECElementEvent): void {
        if (event.dataIndex == null) return;
        const category = this.barCategories[event.dataIndex];
        if (category) this.openCategory(category);
    }
}
