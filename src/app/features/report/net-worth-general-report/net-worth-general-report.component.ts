import { Component, OnInit, effect, inject } from '@angular/core';
import { NgIf, NgFor, NgClass, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { EChartsOption } from 'echarts';

import { NetWorthService } from '../services/net-worth.service';
import { NetWorthTotal, NetWorthMonthlyPoint, StaleAsset } from '../models/net-worth.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { ContrastTextPipe } from '../../../shared/pipes/contrastText/contrast-text.pipe';

@Component({
    selector: 'app-net-worth-general-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, NgClass, FormsModule, CurrencyFiatFormatPipe, ChartComponent, DatePipe, DecimalPipe, ContrastTextPipe],
    templateUrl: './net-worth-general-report.component.html',
    styleUrl: './net-worth-general-report.component.css'
})
export class NetWorthGeneralReportComponent implements OnInit {
    private readonly netWorthService = inject(NetWorthService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = true;
    // Arranca en false: todavía no se sabe si hay una moneda seleccionada para pedir la serie.
    // Si quedara en true sin que nada la vuelva a false, el spinner gira para siempre sin explicar por qué.
    isLoadingSeries = false;
    seriesRequested = false;
    totals: NetWorthTotal[] = [];
    staleAssets: StaleAsset[] = [];
    monthly: NetWorthMonthlyPoint[] = [];

    // D-E: bruto por default, apagado — el neto es opt-in, nunca reemplaza al bruto mostrado hoy.
    showNet = false;

    stackedAreaOptions: EChartsOption = {};
    snapshotOptions: EChartsOption = {};

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) this.loadSeries(assetId);
        });
    }

    ngOnInit(): void {
        this.netWorthService.getGeneral().subscribe(data => {
            this.totals = data.totals;
            this.staleAssets = data.staleAssets;
            this.isLoading = false;
        });
    }

    private loadSeries(assetId: number): void {
        this.isLoadingSeries = true;
        this.seriesRequested = true;
        this.netWorthService.getMonthlySeries(assetId).subscribe(data => {
            this.monthly = data;
            this.isLoadingSeries = false;
            setTimeout(() => this.renderCharts(), 0);
        });
    }

    private renderCharts(): void {
        if (this.monthly.length === 0) return;
        this.renderStackedArea();
        this.renderSnapshot();
    }

    private renderStackedArea(): void {
        const labels = this.monthly.map(m => new Date(m.month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        const series = (name: string, data: number[], colorIndex: number) => ({
            name, type: 'line', stack: 'total', areaStyle: {}, showSymbol: false,
            data, itemStyle: { color: this.chartTheme.colorAt(colorIndex) },
        });

        this.stackedAreaOptions = {
            color: [this.chartTheme.colorAt(0), this.chartTheme.colorAt(1), this.chartTheme.colorAt(2), this.chartTheme.colorAt(3)],
            legend: { top: 0, textStyle: { color: axisLabel } },
            grid: { left: 70, right: 20, top: 40, bottom: 40 },
            tooltip: { trigger: 'axis', ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'category', data: labels, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series: [
                series('Cuentas', this.monthly.map(m => m.accounts), 0),
                series('Bolsa', this.monthly.map(m => m.stocks), 1),
                series('Cripto', this.monthly.map(m => m.crypto), 2),
                series('Bonos', this.monthly.map(m => m.bonds), 3),
            ],
        } as EChartsOption;
    }

    private renderSnapshot(): void {
        const last = this.monthly[this.monthly.length - 1];
        const labels = ['Cuentas', 'Bolsa', 'Cripto', 'Bonos'];
        const values = [last.accounts, last.stocks, last.crypto, last.bonds];
        this.snapshotOptions = this.chartTheme.pieOptions(labels, values, {
            donut: true, showLegend: true,
            formatValue: (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 }),
        });
    }

    monthLabel(month: string): string {
        return new Date(month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
    }

    variation(index: number): number {
        if (index === 0) return 0;
        const prev = this.monthly[index - 1].total;
        const curr = this.monthly[index].total;
        return curr - prev;
    }

    variationPct(index: number): number {
        if (index === 0) return 0;
        const prev = this.monthly[index - 1].total;
        if (prev === 0) return 0;
        return (this.variation(index) / prev) * 100;
    }
}
