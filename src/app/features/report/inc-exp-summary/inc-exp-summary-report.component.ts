import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { IncomeExpenseService } from '../services/income-expense.service';
import { CardReconciliation, IncExpWaterfall } from '../models/income-expense.model';
import { ReportContextService, SpendingMeasure } from '../../../shared/services/report-context.service';
import { SpendingMeasureNoticeComponent } from '../../../shared/components/spending-measure-notice/spending-measure-notice.component';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { InfoButtonComponent } from '../../../shared/components/info-button/info-button.component';

@Component({
    selector: 'app-inc-exp-summary-report',
    standalone: true,
    imports: [SpendingMeasureNoticeComponent, LoadingComponent, NgIf, NgFor, CurrencyFiatFormatPipe, ChartComponent, InfoButtonComponent],
    templateUrl: './inc-exp-summary-report.component.html',
    styleUrl: './inc-exp-summary-report.component.css'
})
export class IncExpSummaryReportComponent {
    private readonly incomeExpenseService = inject(IncomeExpenseService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    // Arranca en false: recién se pide algo cuando hay moneda elegida (mismo criterio que Patrimonio).
    isLoading = false;
    dataRequested = false;
    currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    waterfall: IncExpWaterfall | null = null;

    // "Cómo se llega al gasto con tarjeta" (Fase 10, decisión E1): un bloque plegable que pide su detalle recién cuando se abre, y solo con la medida de compra.
    // Está siempre en la página (oculto, no desmontado) para que su tabla entre en la exportación a Excel del reporte.
    reconciliation: CardReconciliation | null = null;
    reconciliationOpen = false;
    isLoadingReconciliation = false;
    reconciliationFailed = false;
    private reconciliationMonth: string | null = null;

    waterfallOptions: EChartsOption = {};

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            // Leer la medida acá hace que el reporte se vuelva a pedir al mover el interruptor de la barra.
            const measure = this.reportContext.spendingMeasure();
            if (assetId != null) this.load(assetId, measure);
        });
    }

    // Vuelve a pedir el reporte con la moneda y la medida elegidas en la barra (al cambiar de mes, de año o de ventana).
    private reload(): void {
        const assetId = this.reportContext.currencyAssetId();
        if (assetId != null) this.load(assetId, this.reportContext.spendingMeasure());
    }

    private load(assetId: number, measure: SpendingMeasure): void {
        this.isLoading = true;
        this.dataRequested = true;
        const monthParam = this.toMonthParam(this.currentMonth);
        this.incomeExpenseService.getWaterfall(assetId, monthParam, measure).subscribe(data => {
            this.waterfall = data;
            this.isLoading = false;
            setTimeout(() => this.renderWaterfall(), 0);
        });
        // Si el bloque está abierto, sigue al mes que se está mirando (solo se vuelve a pedir si cambió el mes).
        this.ensureReconciliation();
    }

    // Con la medida de cuentas no hay conciliación que mostrar: lo que se explica es el gasto por compra.
    get showReconciliation(): boolean {
        return this.reportContext.spendingMeasure() === 'purchase' && this.waterfall != null;
    }

    toggleReconciliation(): void {
        this.reconciliationOpen = !this.reconciliationOpen;
        if (this.reconciliationOpen) this.ensureReconciliation();
    }

    retryReconciliation(): void {
        this.reconciliationMonth = null;
        this.ensureReconciliation();
    }

    private ensureReconciliation(): void {
        const month = this.toMonthParam(this.currentMonth);
        if (!this.reconciliationOpen || this.reportContext.spendingMeasure() !== 'purchase' || this.reconciliationMonth === month) return;

        this.reconciliationMonth = month;
        this.reconciliation = null;
        this.reconciliationFailed = false;
        this.isLoadingReconciliation = true;
        this.incomeExpenseService.getCardReconciliation(month).subscribe({
            next: data => {
                // Una respuesta de un mes que ya no es el que se mira se descarta.
                if (this.reconciliationMonth !== month) return;
                this.reconciliation = data;
                this.isLoadingReconciliation = false;
            },
            error: () => {
                if (this.reconciliationMonth !== month) return;
                this.reconciliationMonth = null; // para que "Reintentar" vuelva a pedir
                this.reconciliationFailed = true;
                this.isLoadingReconciliation = false;
            }
        });
    }

    // Con la medida de cuentas, un mes con cargos de tarjeta y sin resumen cargado tiene el gasto de tarjeta sin contar (decisión D5, Flujo 6).
    get showStatementMissing(): boolean {
        return this.reportContext.spendingMeasure() === 'accounts' && this.waterfall?.cardStatementMissing === true;
    }

    get statementMonthName(): string {
        return this.currentMonth.toLocaleDateString('es-AR', { month: 'long' });
    }

    get hasDollars(): boolean {
        const d = this.reconciliation?.dollars;
        return !!d && (d.statementAmount !== 0 || d.spending !== 0);
    }

    /** Los centavos de redondeo solo se muestran si hay (la mayoría de los meses dan cero). */
    get hasRounding(): boolean {
        return !!this.reconciliation && (Math.abs(this.reconciliation.pesos.rounding) >= 0.01 || Math.abs(this.reconciliation.dollars.rounding) >= 0.01);
    }

    /** Un monto en dólares ("US$ 10,00"): las secciones en dólares de la conciliación van en su moneda. */
    formatUsd(value: number): string {
        return 'US$ ' + value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    previousMonth(): void {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
        this.reload();
    }

    nextMonth(): void {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
        this.reload();
    }

    get monthLabel(): string {
        return this.currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    }

    get resultVariation(): number | null {
        if (!this.waterfall) return null;
        return this.waterfall.result - this.waterfall.previousMonthResult;
    }

    private toMonthParam(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}-01`;
    }

    // Cascada: ingresos, un escalón por categoría de egreso (mayor a menor) y el resultado del mes,
    // con la técnica estándar de ECharts (serie transparente de base + serie visible apilada).
    private renderWaterfall(): void {
        if (!this.waterfall) return;
        const steps = this.waterfall.expenseSteps;
        const categories = ['Ingresos', ...steps.map(s => s.categoryName), 'Resultado'];

        const base: number[] = [0];
        const values: number[] = [this.waterfall.totalIncome];
        const colors: string[] = [this.chartTheme.colorAt(2)];

        let cumulative = this.waterfall.totalIncome;
        for (const step of steps) {
            const newCumulative = cumulative - step.amount;
            base.push(Math.min(cumulative, newCumulative));
            values.push(step.amount);
            colors.push(this.chartTheme.colorAt(7));
            cumulative = newCumulative;
        }

        base.push(0);
        values.push(this.waterfall.result);
        colors.push(this.waterfall.result >= 0 ? this.chartTheme.colorAt(2) : this.chartTheme.colorAt(7));

        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        this.waterfallOptions = {
            grid: { left: 70, right: 20, top: 30, bottom: 60 },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                ...this.chartTheme.tooltipDefaults(),
                formatter: (params: unknown) => {
                    const p = (params as any[]).find(x => x.seriesName === 'Monto');
                    return p ? `${p.name}: ${fmt(p.value)}` : '';
                },
            },
            xAxis: {
                type: 'category', data: categories,
                axisLabel: { color: axisLabel, rotate: categories.length > 5 ? 20 : 0 },
                axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } },
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) },
                splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } },
            },
            series: [
                { name: 'Base', type: 'bar', stack: 'total', itemStyle: { color: 'transparent' }, silent: true, data: base },
                { name: 'Monto', type: 'bar', stack: 'total', data: values.map((v, i) => ({ value: v, itemStyle: { color: colors[i] } })) },
            ],
        };
    }
}
