import { Component, OnInit, effect, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { NetWorthService } from '../services/net-worth.service';
import { CurrencyExposure } from '../models/net-worth.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

@Component({
    selector: 'app-net-worth-by-currency-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, CurrencyFiatFormatPipe, ChartComponent],
    templateUrl: './net-worth-by-currency-report.component.html',
    styleUrl: './net-worth-by-currency-report.component.css'
})
export class NetWorthByCurrencyReportComponent implements OnInit {
    private readonly netWorthService = inject(NetWorthService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = true;
    isLoadingSeries = true;
    exposure: CurrencyExposure[] = [];

    exposureOptions: EChartsOption = {};
    dollarizedSeriesOptions: EChartsOption = {};

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) this.loadExposure(assetId);
        });
    }

    ngOnInit(): void {
        this.netWorthService.getDollarizedSeries().subscribe(data => {
            const labels = data.map(p => new Date(p.month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));
            const values = data.map(p => p.balance);
            this.dollarizedSeriesOptions = this.chartTheme.lineOptions(labels, values, {
                formatValue: (v: number) => `${this.chartTheme.formatNumber(v, { maximumFractionDigits: 1 })}%`,
            });
            this.isLoadingSeries = false;
        });
    }

    private loadExposure(assetId: number): void {
        this.isLoading = true;
        this.netWorthService.getByCurrency(assetId).subscribe(data => {
            this.exposure = data;
            this.isLoading = false;
            setTimeout(() => this.renderExposure(), 0);
        });
    }

    private renderExposure(): void {
        if (this.exposure.length === 0) return;
        const names = this.exposure.map(e => e.label);
        const values = this.exposure.map(e => e.balance);
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        const axisLabel = this.chartTheme.surface.axisLabel;

        this.exposureOptions = {
            grid: { left: 100, right: 30, top: 20, bottom: 30 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            yAxis: { type: 'category', data: names, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            series: [{
                type: 'bar',
                data: values,
                itemStyle: { color: (p: any) => this.chartTheme.colorAt(p.dataIndex) },
            }],
        };
    }
}
