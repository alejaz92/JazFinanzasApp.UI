import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { IncomeExpenseService } from '../services/income-expense.service';
import { IncExpWaterfall } from '../models/income-expense.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

@Component({
    selector: 'app-inc-exp-summary-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, CurrencyFiatFormatPipe, ChartComponent],
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

    waterfallOptions: EChartsOption = {};

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
        this.incomeExpenseService.getWaterfall(assetId, monthParam).subscribe(data => {
            this.waterfall = data;
            this.isLoading = false;
            setTimeout(() => this.renderWaterfall(), 0);
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
