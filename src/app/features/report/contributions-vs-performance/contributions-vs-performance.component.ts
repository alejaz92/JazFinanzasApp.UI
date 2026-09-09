import { Component, effect, inject } from '@angular/core';
import { NgIf, DatePipe } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { InvestmentReportService } from '../services/investment-report.service';
import { ContributionsVsPerformance } from '../models/investment-report.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

interface WaterfallStep {
    name: string;
    base: number;
    delta: number;
    color: string;
    displayValue: number;
}

// Aportes vs rendimiento (Fase 20, Flujo 5): cascada Valor inicial → Aportes → Retiros →
// Valorización → Valor final, sobre GetContributionsVsPerformanceAsync (Fase 19). ECharts no tiene
// un tipo "waterfall" nativo — se arma con el truco clásico de dos series de barra apiladas: una
// "base" transparente (dónde empieza a flotar cada barra) y una "delta" visible (el tramo que se
// ve), salvo en el primer y último paso, que son barras totales desde 0.
@Component({
    selector: 'app-contributions-vs-performance',
    standalone: true,
    imports: [LoadingComponent, NgIf, DatePipe, CurrencyFiatFormatPipe, ChartComponent],
    templateUrl: './contributions-vs-performance.component.html',
    styleUrl: './contributions-vs-performance.component.css'
})
export class ContributionsVsPerformanceComponent {
    private readonly investmentReportService = inject(InvestmentReportService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = true;
    data: ContributionsVsPerformance | null = null;
    waterfallOptions: EChartsOption = {};

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) this.load(assetId);
        });
    }

    private load(assetId: number): void {
        this.isLoading = true;
        this.investmentReportService.getContributionsVsPerformance(assetId).subscribe(data => {
            this.data = data;
            this.isLoading = false;
            setTimeout(() => this.renderWaterfall(data), 0);
        });
    }

    private buildSteps(data: ContributionsVsPerformance): WaterfallStep[] {
        const status = this.chartTheme.status;
        const totalColor = this.chartTheme.colorAt(6);
        const steps: WaterfallStep[] = [];

        steps.push({ name: 'Valor inicial', base: 0, delta: data.initialValue, color: totalColor, displayValue: data.initialValue });
        let cum = data.initialValue;

        const afterContributions = cum + data.contributed;
        steps.push({ name: 'Aportes', base: Math.min(cum, afterContributions), delta: data.contributed, color: status.good, displayValue: data.contributed });
        cum = afterContributions;

        const afterWithdrawals = cum - data.withdrawn;
        steps.push({ name: 'Retiros', base: Math.min(cum, afterWithdrawals), delta: data.withdrawn, color: status.critical, displayValue: -data.withdrawn });
        cum = afterWithdrawals;

        const afterValuation = cum + data.valuation;
        steps.push({
            name: 'Valorización', base: Math.min(cum, afterValuation), delta: Math.abs(data.valuation),
            color: data.valuation >= 0 ? status.good : status.critical, displayValue: data.valuation,
        });
        cum = afterValuation;

        steps.push({ name: 'Valor final', base: 0, delta: data.finalValue, color: totalColor, displayValue: data.finalValue });

        return steps;
    }

    private renderWaterfall(data: ContributionsVsPerformance): void {
        const steps = this.buildSteps(data);
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        // Object.is(v, -0): -data.withdrawn con Withdrawn = 0 da -0 en JS — Intl.NumberFormat lo
        // imprime como "-0", así que "+" delante quedaba "+-0" en vez de "+0".
        const signed = (v: number) => { const n = Object.is(v, -0) ? 0 : v; return `${n >= 0 ? '+' : ''}${fmt(n)}`; };

        this.waterfallOptions = {
            grid: { left: 80, right: 20, top: 30, bottom: 40 },
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(),
                formatter: (params: any) => {
                    const step = steps[params[0].dataIndex];
                    return `${step.name}: ${signed(step.displayValue)}`;
                },
            },
            xAxis: { type: 'category', data: steps.map(s => s.name), axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series: [
                { name: 'base', type: 'bar', stack: 'total', silent: true, itemStyle: { color: 'transparent' }, data: steps.map(s => s.base) },
                {
                    name: 'valor', type: 'bar', stack: 'total',
                    data: steps.map(s => ({ value: s.delta, itemStyle: { color: s.color } })),
                    label: { show: true, position: 'top', color: axisLabel, formatter: (p: any) => signed(steps[p.dataIndex].displayValue) },
                },
            ],
        } as EChartsOption;
    }
}
