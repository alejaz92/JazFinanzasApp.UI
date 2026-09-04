import { Component, effect, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { IncomeExpenseService } from '../services/income-expense.service';
import { IncomeCategorySeries, IncomeComposition } from '../models/income-expense.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

const EVOLUTION_MONTHS = 24;

@Component({
    selector: 'app-inc-income-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, CurrencyFiatFormatPipe, ChartComponent],
    templateUrl: './inc-income-report.component.html',
    styleUrl: './inc-income-report.component.css'
})
export class IncIncomeReportComponent {
    private readonly incomeExpenseService = inject(IncomeExpenseService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = false;
    dataRequested = false;

    // Composición de un mes elegido — lo principal (corrección 2026-09-04: el usuario pidió
    // expresamente poder elegir un mes y ver la composición, no una evolución).
    currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    composition: IncomeComposition | null = null;
    compositionOptions: EChartsOption = {};

    // Evolución en el tiempo — secundaria, queda como complemento debajo de la composición.
    // "Días de cobro" se separó a su propio reporte (features/report/inc-pay-days).
    categories: IncomeCategorySeries[] = [];
    evolutionOptions: EChartsOption = {};

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) this.load(assetId);
        });
    }

    private load(assetId: number): void {
        this.isLoading = true;
        this.dataRequested = true;

        this.incomeExpenseService.getIncomeComposition(assetId, this.toMonthParam(this.currentMonth)).subscribe(data => {
            this.composition = data;
            this.isLoading = false;
            this.renderComposition();
        });

        this.incomeExpenseService.getIncomeByCategory(assetId, EVOLUTION_MONTHS).subscribe(data => {
            this.categories = data;
            this.renderEvolution();
        });
    }

    previousMonth(): void {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
        const assetId = this.reportContext.currencyAssetId();
        if (assetId != null) this.loadComposition(assetId);
    }

    nextMonth(): void {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
        const assetId = this.reportContext.currencyAssetId();
        if (assetId != null) this.loadComposition(assetId);
    }

    private loadComposition(assetId: number): void {
        this.incomeExpenseService.getIncomeComposition(assetId, this.toMonthParam(this.currentMonth)).subscribe(data => {
            this.composition = data;
            this.renderComposition();
        });
    }

    get monthLabel(): string {
        return this.currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    }

    get compositionTotal(): number {
        return this.composition?.categories.reduce((sum, c) => sum + c.amount, 0) ?? 0;
    }

    private toMonthParam(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}-01`;
    }

    private renderComposition(): void {
        if (!this.composition || this.composition.categories.length === 0) return;
        const labels = this.composition.categories.map(c => c.categoryName);
        const values = this.composition.categories.map(c => c.amount);
        this.compositionOptions = this.chartTheme.pieOptions(labels, values, {
            donut: true, showLegend: true,
            formatValue: (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 }),
        });
    }

    private renderEvolution(): void {
        if (this.categories.length === 0) return;
        const today = new Date();
        const labels: string[] = [];
        for (let i = EVOLUTION_MONTHS - 1; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            labels.push(d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }));
        }

        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        this.evolutionOptions = {
            color: this.categories.map((_, i) => this.chartTheme.colorAt(i)),
            legend: { top: 0, textStyle: { color: axisLabel } },
            grid: { left: 80, right: 20, top: 40, bottom: 40 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: {
                type: 'category', data: labels,
                axisLabel: { color: axisLabel, interval: Math.ceil(EVOLUTION_MONTHS / 12) - 1 },
                axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } },
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) },
                splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } },
            },
            series: this.categories.map(c => ({
                name: c.categoryName,
                type: 'bar',
                stack: 'total',
                data: c.monthlyTrend,
            })),
        };
    }
}
