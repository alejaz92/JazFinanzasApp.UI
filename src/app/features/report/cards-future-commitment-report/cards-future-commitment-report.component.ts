import { Component, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import type { EChartsOption, ECElementEvent } from 'echarts';

import { CardReportService } from '../services/card-report.service';
import { CardFutureCommitment, FutureCommitmentPurchaseAmount } from '../models/card-report.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

declare const bootstrap: any;

// Tarjetas — Compromiso futuro (Fase 15): cuánta plata de los próximos meses ya está comprometida
// en cuotas (CardReportController.GetFutureCommitmentAsync, T8 extendido). El checkpoint de esta
// fase pide explícitamente un estado vacío con sentido cuando no hay nada por vencer — no es un
// detalle cosmético, es la respuesta correcta la mayoría de los meses (sección 6, Flujo 4).
// Corrección 2026-09-05: los montos vienen convertidos a la moneda elegida en la barra de Reportes.
// Corrección 2026-09-05, cuarta ronda: el color de "Cuotas por vencer" pasó de una compra a una
// categoría (con varias compras vivas a la vez, un color por compra era ilegible) y el clic en un
// segmento abre el panel lateral con el detalle — mismo patrón que Ingresos y Egresos → Por categoría.
@Component({
    selector: 'app-cards-future-commitment-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, CurrencyFiatFormatPipe, ChartComponent],
    templateUrl: './cards-future-commitment-report.component.html',
    styleUrl: './cards-future-commitment-report.component.css'
})
export class CardsFutureCommitmentReportComponent {
    private readonly cardReportService = inject(CardReportService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = false;
    dataRequested = false;
    data: CardFutureCommitment | null = null;

    stackedOptions: EChartsOption = {};
    ganttOptions: EChartsOption = {};
    private stackedCategoryIds: number[] = [];

    // Panel lateral de detalle (clic en un segmento del gráfico apilado).
    selectedCategoryName: string | null = null;
    selectedMonthLabel = '';
    panelPurchases: FutureCommitmentPurchaseAmount[] = [];
    @ViewChild('drawerRef') private drawerRef?: ElementRef<HTMLElement>;
    private drawerInstance: any;

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            const includeRecurring = this.reportContext.includeRecurringExpenses();
            const cardId = this.reportContext.selectedCardId() ?? 0;
            if (assetId != null) this.load(assetId, includeRecurring, cardId);
        });
    }

    private load(assetId: number, includeRecurring: boolean, cardId: number): void {
        this.isLoading = true;
        this.dataRequested = true;
        this.cardReportService.getFutureCommitment(assetId, includeRecurring, cardId).subscribe(data => {
            this.data = data;
            this.isLoading = false;
            setTimeout(() => this.renderCharts(), 0);
        });
    }

    get hasCommitment(): boolean {
        return (this.data?.timeline.length ?? 0) > 0;
    }

    private renderCharts(): void {
        if (!this.data || !this.hasCommitment) return;
        this.renderStacked();
        this.renderGantt();
    }

    // Columnas apiladas hacia adelante, agrupadas por categoría (no por compra — con varias compras
    // vivas a la vez un color por compra dejaba de leerse). Clic en un segmento abre el detalle.
    private renderStacked(): void {
        const months = this.data!.monthlySeries;
        const labels = months.map(m => new Date(m.month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        const categoryIds = Array.from(new Set(months.flatMap(m => m.purchases.map(p => p.transactionClassId))));
        const nameById = new Map(months.flatMap(m => m.purchases).map(p => [p.transactionClassId, p.transactionClassName]));
        this.stackedCategoryIds = categoryIds;

        this.stackedOptions = {
            color: categoryIds.map((_, i) => this.chartTheme.colorAt(i)),
            legend: { top: 0, type: 'scroll', textStyle: { color: axisLabel } },
            grid: { left: 70, right: 20, top: 50, bottom: 40 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'category', data: labels, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series: categoryIds.map((id, i) => ({
                name: nameById.get(id),
                type: 'bar',
                stack: 'total',
                itemStyle: { color: this.chartTheme.colorAt(i) },
                data: months.map(m => {
                    const total = m.purchases.filter(p => p.transactionClassId === id).reduce((sum, p) => sum + p.amount, 0);
                    return Math.round(total * 100) / 100;
                }),
            })),
        } as EChartsOption;
    }

    // Clic en un segmento (categoría, mes): las compras que arman ese número ya están en memoria
    // (vinieron con la respuesta), no hace falta pedirle nada nuevo al backend.
    onStackedClick(event: ECElementEvent): void {
        if (event.seriesIndex == null || event.dataIndex == null || !this.data) return;
        const categoryId = this.stackedCategoryIds[event.seriesIndex];
        const month = this.data.monthlySeries[event.dataIndex];
        const purchases = month.purchases.filter(p => p.transactionClassId === categoryId);
        if (purchases.length === 0) return;

        this.selectedCategoryName = purchases[0].transactionClassName;
        this.selectedMonthLabel = new Date(month.month).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
        this.panelPurchases = purchases;
        this.openDrawer();
    }

    closeDetail(): void {
        this.selectedCategoryName = null;
        this.panelPurchases = [];
        this.drawerInstance?.hide();
    }

    private openDrawer(): void {
        setTimeout(() => {
            const el = this.drawerRef?.nativeElement;
            if (!el) return;
            this.drawerInstance = bootstrap.Offcanvas.getOrCreateInstance(el);
            this.drawerInstance.show();
        });
    }

    // Cronograma: gantt horizontal armado con el truco estándar de ECharts (barra invisible de
    // offset + barra visible de duración, ambas apiladas) — no hay tipo de serie "gantt" nativo.
    // Sigue coloreado por compra individual (no por categoría): acá el propósito es distinguir cada
    // compra viva, no agrupar.
    private renderGantt(): void {
        const timeline = [...this.data!.timeline].sort((a, b) => a.startMonth.localeCompare(b.startMonth));
        const months = this.data!.monthlySeries.map(m => m.month.substring(0, 7));
        const monthLabels = this.data!.monthlySeries.map(m => new Date(m.month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        const indexOf = (month: string) => Math.max(0, months.indexOf(month.substring(0, 7)));
        const rows = timeline.map(t => ({
            label: `${t.detail} (${t.cardName})`,
            start: indexOf(t.startMonth),
            duration: indexOf(t.endMonth) - indexOf(t.startMonth) + 1,
            amount: t.installmentAmount,
        }));

        this.ganttOptions = {
            grid: { left: 220, right: 30, top: 20, bottom: 40 },
            tooltip: {
                trigger: 'item',
                ...this.chartTheme.tooltipDefaults(),
                formatter: (p: any) => (p.seriesName === 'duración' ? `${rows[p.dataIndex].label}: ${fmt(rows[p.dataIndex].amount)}/mes` : ''),
            },
            xAxis: {
                type: 'value',
                min: 0,
                max: months.length,
                interval: 1,
                axisLabel: { color: axisLabel, formatter: (v: number) => monthLabels[Math.round(v)] ?? '' },
                splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } },
            },
            // Corrección 2026-09-05, séptima ronda: antes el label quedaba cortado en seco sin
            // aviso — ahora entra en dos líneas (width + overflow: 'break') y, si igual no alcanza,
            // el tooltip ["label"] siempre tiene el texto completo.
            yAxis: {
                type: 'category',
                data: rows.map(r => r.label),
                axisLabel: { color: axisLabel, width: 200, overflow: 'break', lineHeight: 14 },
                axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } },
            },
            series: [
                { name: 'offset', type: 'bar', stack: 'gantt', silent: true, itemStyle: { color: 'transparent' }, data: rows.map(r => r.start) },
                { name: 'duración', type: 'bar', stack: 'gantt', data: rows.map(r => r.duration), itemStyle: { color: (p: any) => this.chartTheme.colorAt(p.dataIndex) } },
            ],
        } as EChartsOption;
    }

    get ganttHeight(): number {
        return Math.max(200, (this.data?.timeline.length ?? 0) * 50);
    }

    get panelTotal(): number {
        return Math.round(this.panelPurchases.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
    }
}
