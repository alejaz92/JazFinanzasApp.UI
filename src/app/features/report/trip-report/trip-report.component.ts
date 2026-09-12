import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { TripReportService } from '../services/trip-report.service';
import { TripDetailReport } from '../models/trip-report.model';
import { AssetService } from '../../asset/services/asset.service';
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

// Viajes — Detalle (Fase 22, Flujo 6): reescrita sobre TripReportController (Fase 21). El selector
// de viaje pasa a la barra de filtros compartida (tripFilter: 'required', mismo criterio que "Por
// tarjeta"/"Por evento"), en vez de vivir suelto en el cuerpo de esta pantalla. Suma lo que pedía el
// Flujo 6 y no estaba: cascada por categoría (mismo truco de dos series apiladas que "Aportes vs
// rendimiento", Fase 20), gasto día a día y comparación de costo por día contra los demás viajes.
@Component({
    selector: 'app-trip-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, CurrencyFiatFormatPipe, ChartComponent],
    templateUrl: './trip-report.component.html',
    styleUrl: './trip-report.component.css'
})
export class TripReportComponent {
    private readonly tripReportService = inject(TripReportService);
    private readonly assetService = inject(AssetService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = true;
    detail: TripDetailReport | null = null;
    referenceAssetSymbol = '';

    waterfallOptions: EChartsOption = {};
    dailySpendingOptions: EChartsOption = {};
    costPerDayComparisonOptions: EChartsOption = {};

    private referenceAssetSymbols = new Map<number, string>();

    constructor() {
        this.assetService.getReferenceAssets().subscribe(assets => {
            this.referenceAssetSymbols = assets.reduce((map, a) => map.set(a.id, a.symbol), new Map<number, string>());
            const current = this.reportContext.currencyAssetId();
            if (current != null) this.referenceAssetSymbol = this.referenceAssetSymbols.get(current) ?? '';
        });

        effect(() => {
            const tripId = this.reportContext.selectedTripId();
            const assetId = this.reportContext.currencyAssetId();
            if (tripId == null || assetId == null) return;
            this.load(tripId, assetId);
        });
    }

    private load(tripId: number, assetId: number): void {
        this.isLoading = true;
        this.referenceAssetSymbol = this.referenceAssetSymbols.get(assetId) ?? '';
        this.tripReportService.getDetail(tripId, assetId).subscribe(detail => {
            this.detail = detail;
            this.isLoading = false;
            setTimeout(() => this.renderCharts(detail), 0);
        });
    }

    private renderCharts(detail: TripDetailReport): void {
        this.renderWaterfall(detail);
        this.renderDailySpending(detail);
        this.renderCostPerDayComparison(detail);
    }

    private renderWaterfall(detail: TripDetailReport): void {
        if (detail.breakdown.length === 0) {
            this.waterfallOptions = {};
            return;
        }

        const totalColor = this.chartTheme.colorAt(6);
        let cum = 0;
        const steps: WaterfallStep[] = detail.breakdown.map((b, i) => {
            const base = cum;
            cum += b.amount;
            return { name: b.transactionClass, base, delta: b.amount, color: this.chartTheme.colorAt(i), displayValue: b.amount };
        });
        steps.push({ name: 'Total', base: 0, delta: cum, color: totalColor, displayValue: cum });

        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        this.waterfallOptions = {
            grid: { left: 80, right: 20, top: 30, bottom: 60 },
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(),
                formatter: (params: any) => `${steps[params[0].dataIndex].name}: ${fmt(steps[params[0].dataIndex].displayValue)}`,
            },
            xAxis: { type: 'category', data: steps.map(s => s.name), axisLabel: { color: axisLabel, rotate: 20 }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series: [
                { name: 'base', type: 'bar', stack: 'total', silent: true, itemStyle: { color: 'transparent' }, data: steps.map(s => s.base) },
                {
                    name: 'valor', type: 'bar', stack: 'total',
                    data: steps.map(s => ({ value: s.delta, itemStyle: { color: s.color } })),
                    label: { show: true, position: 'top', color: axisLabel, formatter: (p: any) => fmt(steps[p.dataIndex].displayValue) },
                },
            ],
        } as EChartsOption;
    }

    private renderDailySpending(detail: TripDetailReport): void {
        if (detail.dailySpending.length === 0) {
            this.dailySpendingOptions = {};
            return;
        }

        const labels = detail.dailySpending.map(d => new Date(d.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }));
        const values = detail.dailySpending.map(d => d.amount);
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        this.dailySpendingOptions = {
            grid: { left: 70, right: 20, top: 20, bottom: 40 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'category', data: labels, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series: [{ type: 'bar', data: values, itemStyle: { color: this.chartTheme.colorAt(0) } }],
        } as EChartsOption;
    }

    private renderCostPerDayComparison(detail: TripDetailReport): void {
        if (detail.costPerDayComparison.length === 0) {
            this.costPerDayComparisonOptions = {};
            return;
        }

        const sorted = [...detail.costPerDayComparison].sort((a, b) => b.costPerDay - a.costPerDay);
        const names = sorted.map(c => c.name);
        const values = sorted.map(c => c.costPerDay);
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        const highlight = this.chartTheme.colorAt(0);
        const muted = this.chartTheme.surface.axisLine;
        const leftMargin = Math.min(200, Math.max(110, Math.max(...names.map(n => n.length)) * 7));

        this.costPerDayComparisonOptions = {
            grid: { left: leftMargin, right: 30, top: 20, bottom: 30 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            yAxis: { type: 'category', data: names, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            series: [{
                type: 'bar',
                data: values,
                itemStyle: { color: (p: any) => (sorted[p.dataIndex].isCurrent ? highlight : muted) },
            }],
        } as EChartsOption;
    }
}
