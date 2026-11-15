import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { IncomeExpenseService } from '../services/income-expense.service';
import { IncExpEvolutionPoint } from '../models/income-expense.model';
import { ReportContextService, SpendingMeasure } from '../../../shared/services/report-context.service';
import { SpendingMeasureNoticeComponent } from '../../../shared/components/spending-measure-notice/spending-measure-notice.component';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { InfoButtonComponent } from '../../../shared/components/info-button/info-button.component';

@Component({
    selector: 'app-inc-exp-evolution-report',
    standalone: true,
    imports: [SpendingMeasureNoticeComponent, LoadingComponent, NgIf, NgFor, CurrencyFiatFormatPipe, ChartComponent, InfoButtonComponent],
    templateUrl: './inc-exp-evolution-report.component.html',
    styleUrl: './inc-exp-evolution-report.component.css'
})
export class IncExpEvolutionReportComponent {
    private readonly incomeExpenseService = inject(IncomeExpenseService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = false;
    dataRequested = false;
    months = 24;
    points: IncExpEvolutionPoint[] = [];

    chartOptions: EChartsOption = {};

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
        this.incomeExpenseService.getEvolution(assetId, this.months, measure).subscribe(data => {
            this.points = data;
            this.isLoading = false;
            setTimeout(() => this.renderChart(), 0);
        });
    }

    setMonths(months: number): void {
        if (this.months === months) return;
        this.months = months;
        this.reload();
    }

    monthLabel(month: string): string {
        return new Date(month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
    }

    // Barras de ingreso/egreso enfrentadas (el egreso se grafica en negativo para que "enfrente" al
    // ingreso, D-A) + línea de resultado acumulado + banda del promedio móvil de 6 meses.
    private renderChart(): void {
        if (this.points.length === 0) return;
        const labels = this.points.map(p => this.monthLabel(p.month));
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        this.chartOptions = {
            color: [this.chartTheme.colorAt(2), this.chartTheme.colorAt(7), this.chartTheme.colorAt(0), this.chartTheme.colorAt(4)],
            legend: { top: 0, textStyle: { color: axisLabel } },
            grid: { left: 80, right: 20, top: 40, bottom: 40 },
            tooltip: { trigger: 'axis', ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Math.abs(Number(v))) },
            xAxis: {
                type: 'category', data: labels,
                axisLabel: { color: axisLabel, interval: this.points.length > 12 ? Math.ceil(this.points.length / 12) - 1 : 0 },
                axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } },
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: axisLabel, formatter: (v: number) => fmt(Math.abs(v)) },
                splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } },
            },
            series: [
                { name: 'Ingresos', type: 'bar', data: this.points.map(p => p.income) },
                { name: 'Egresos', type: 'bar', data: this.points.map(p => -p.expense) },
                { name: 'Resultado acumulado', type: 'line', data: this.points.map(p => p.cumulativeResult), showSymbol: false, lineStyle: { width: 2 } },
                {
                    name: 'Promedio móvil de gasto (6 meses)', type: 'line',
                    data: this.points.map(p => p.expenseMovingAverage != null ? -p.expenseMovingAverage : null),
                    showSymbol: false, lineStyle: { width: 1.5, type: 'dashed' },
                },
            ],
        };
    }
}
