import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { InvestmentReportService } from '../services/investment-report.service';
import { StockTickerReport } from '../models/investment-report.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';
import { CurrencyQuoteFormatPipe } from '../../../shared/pipes/currencyQuoteFormat/currency-quote-format.pipe';

// Bolsa (Fase 20, Flujo 5): reescrita sobre InvestmentReportController (Fase 19). A diferencia de
// la pantalla vieja, ya no hay que elegir un AssetType — GetStocksAsync junta Acción Argentina,
// CEDEAR, FCI y Acción USA en un solo reporte por ticker (un solo reporte, no uno por tipo, como
// describe el Flujo 5). Reemplaza las dos tortas y la barra agrupada por barras divergentes de
// ganancia/pérdida + dispersión rendimiento vs peso en la cartera.
@Component({
    selector: 'app-stocks-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe, CurrencyQuoteFormatPipe, ChartComponent],
    templateUrl: './stocks-report.component.html',
    styleUrl: './stocks-report.component.css'
})
export class StocksReportComponent {
    private readonly investmentReportService = inject(InvestmentReportService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = true;
    referenceAssetSymbol = '';
    totalOriginalValue = 0;
    totalActualValue = 0;
    tickers: StockTickerReport[] = [];

    gainLossOptions: EChartsOption = {};
    dispersionOptions: EChartsOption = {};

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) this.load(assetId);
        });
    }

    get totalGainLossPct(): number | null {
        return this.totalOriginalValue > 0 ? (this.totalActualValue / this.totalOriginalValue * 100) - 100 : null;
    }

    private load(assetId: number): void {
        this.isLoading = true;
        this.investmentReportService.getStocks(assetId).subscribe(data => {
            this.referenceAssetSymbol = data.referenceAssetSymbol;
            this.totalOriginalValue = data.totalOriginalValue;
            this.totalActualValue = data.totalActualValue;
            this.tickers = data.tickers;
            this.isLoading = false;
            setTimeout(() => this.renderCharts(), 0);
        });
    }

    private renderCharts(): void {
        if (this.tickers.length === 0) return;
        this.renderGainLoss();
        this.renderDispersion();
    }

    private renderGainLoss(): void {
        const sorted = [...this.tickers].sort((a, b) => a.gainLossAmount - b.gainLossAmount);
        const labels = sorted.map(t => t.symbol);
        const values = sorted.map(t => t.gainLossAmount);
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        this.gainLossOptions = this.chartTheme.divergingBarOptions(labels, values, { formatValue: fmt });
    }

    private renderDispersion(): void {
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 1 });

        this.dispersionOptions = {
            grid: { left: 60, right: 30, top: 20, bottom: 40 },
            tooltip: {
                ...this.chartTheme.tooltipDefaults(),
                formatter: (p: any) => `${p.data[2]}<br/>Peso: ${fmt(p.data[0])}%<br/>Rendimiento: ${fmt(p.data[1])}%`,
            },
            xAxis: {
                type: 'value', name: 'Peso en la cartera de Bolsa (%)', nameLocation: 'middle', nameGap: 28,
                axisLabel: { color: axisLabel, formatter: (v: number) => `${fmt(v)}%` },
                splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } },
                nameTextStyle: { color: axisLabel },
            },
            yAxis: {
                type: 'value', name: 'Rendimiento (%)', nameLocation: 'middle', nameGap: 45,
                axisLabel: { color: axisLabel, formatter: (v: number) => `${fmt(v)}%` },
                splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } },
                nameTextStyle: { color: axisLabel },
            },
            series: [{
                type: 'scatter',
                symbolSize: 16,
                data: this.tickers.map(t => ({ value: [t.weightPercent, t.gainLossPercent ?? 0, t.symbol], itemStyle: { color: this.chartTheme.gainLossColor(t.gainLossPercent) } })),
                label: { show: true, formatter: (p: any) => p.data.value[2], position: 'top', color: axisLabel, fontSize: 11 },
            }],
        } as EChartsOption;
    }
}
