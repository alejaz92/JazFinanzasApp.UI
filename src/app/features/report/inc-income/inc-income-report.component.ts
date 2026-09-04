import { Component, effect, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { IncomeExpenseService } from '../services/income-expense.service';
import { IncomeCategorySeries, PayDay } from '../models/income-expense.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';

const EVOLUTION_MONTHS = 24;
const PAYDAY_MONTHS = 12;

@Component({
    selector: 'app-inc-income-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, ChartComponent],
    templateUrl: './inc-income-report.component.html',
    styleUrl: './inc-income-report.component.css'
})
export class IncIncomeReportComponent {
    private readonly incomeExpenseService = inject(IncomeExpenseService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = false;
    dataRequested = false;
    categories: IncomeCategorySeries[] = [];
    payDays: PayDay[] = [];

    evolutionOptions: EChartsOption = {};
    payDaysOptions: EChartsOption = {};

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) this.load(assetId);
        });
    }

    private load(assetId: number): void {
        this.isLoading = true;
        this.dataRequested = true;

        this.incomeExpenseService.getIncomeByCategory(assetId, EVOLUTION_MONTHS).subscribe(data => {
            this.categories = data;
            this.renderEvolution();
        });

        this.incomeExpenseService.getPayDays(assetId, PAYDAY_MONTHS).subscribe(data => {
            this.payDays = data.days;
            this.isLoading = false;
            this.renderPayDays();
        });
    }

    // Sueldo + Aporte Familiar explican el 90% del ingreso (relevamiento del plan) — una composición
    // de un solo mes no cuenta nada, así que este reporte mira la evolución en el tiempo en vez de
    // la foto de un mes (mismo patrón que "Evolución y tendencia", pero por categoría de ingreso).
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

    // Barra por día del mes (promedio cuando se cobró) + opacidad según frecuencia — un ingreso
    // ocasional grande se ve tenue, un día de cobro habitual se ve sólido, sin dos gráficos separados.
    private renderPayDays(): void {
        if (this.payDays.length === 0) return;
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        const color = this.chartTheme.colorAt(2);

        this.payDaysOptions = {
            grid: { left: 80, right: 20, top: 20, bottom: 30 },
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(),
                formatter: (params: unknown) => {
                    const p = (params as any[])[0];
                    const day: PayDay = this.payDays[p.dataIndex];
                    return `Día ${day.day}: ${fmt(day.averageAmountWhenReceived)}<br>Cobrado ${day.timesReceived} de ${day.monthsInWindow} meses (${day.frequencyPct}%)`;
                },
            },
            xAxis: {
                type: 'category', data: this.payDays.map(d => d.day),
                axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } },
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) },
                splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } },
            },
            series: [{
                type: 'bar',
                // Opacidad por dato según frecuencia: un ingreso ocasional se ve tenue, un día de
                // cobro habitual se ve sólido — sin necesitar un segundo gráfico.
                data: this.payDays.map(d => ({
                    value: d.averageAmountWhenReceived,
                    // Piso de 0.35: con 0.15 un día raro (4% de frecuencia) quedaba prácticamente
                    // invisible — la barra tiene que notarse igual, solo más tenue que un día habitual.
                    itemStyle: { color, opacity: 0.35 + 0.65 * (d.frequencyPct / 100) },
                })),
            }],
        };
    }
}
