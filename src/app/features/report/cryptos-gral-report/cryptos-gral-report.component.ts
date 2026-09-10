import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { EChartsOption } from 'echarts';

import { InvestmentReportService } from '../services/investment-report.service';
import { StockTickerReport, InvestmentValuePoint, CryptoPurchaseMonth } from '../models/investment-report.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';
import { CurrencyQuoteFormatPipe } from '../../../shared/pipes/currencyQuoteFormat/currency-quote-format.pipe';
import { CommerceTypePipe } from '../../../shared/pipes/commerceType/commerce-type.pipe';

// Cryptos — General (Fase 20, Flujo 5): reescrita sobre InvestmentReportController (Fase 19),
// mismo layout que la pantalla vieja (distribución + evolución del valor + volumen mensual + tabla)
// con el assetId de la barra de Reportes en vez del principal resuelto por Asset_User.
@Component({
    selector: 'app-cryptos-gral-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe, CurrencyQuoteFormatPipe, ChartComponent],
    templateUrl: './cryptos-gral-report.component.html',
    styleUrl: './cryptos-gral-report.component.css'
})
export class CryptosGralReportComponent {
    private readonly investmentReportService = inject(InvestmentReportService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    private static readonly commerceTypeLabel = new CommerceTypePipe();

    isLoading = true;
    includeStables = true;
    referenceAssetSymbol = '';
    totalOriginalValue = 0;
    totalActualValue = 0;
    holdings: StockTickerReport[] = [];
    hasPurchasesByMonth = false;

    distributionOptions: EChartsOption = {};
    walletEvolutionOptions: EChartsOption = {};
    buyVolumeOptions: EChartsOption = {};

    private currentAssetId: number | null = null;

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) {
                this.currentAssetId = assetId;
                this.load(assetId);
            }
        });
    }

    onIncludeStablesChange(): void {
        if (this.currentAssetId != null) this.load(this.currentAssetId);
    }

    get totalGainLossPct(): number | null {
        return this.totalOriginalValue > 0 ? (this.totalActualValue / this.totalOriginalValue * 100) - 100 : null;
    }

    private load(assetId: number): void {
        this.isLoading = true;
        this.investmentReportService.getCryptoOverview(assetId, this.includeStables).subscribe(data => {
            this.referenceAssetSymbol = data.referenceAssetSymbol;
            this.totalOriginalValue = data.totalOriginalValue;
            this.totalActualValue = data.totalActualValue;
            this.holdings = data.holdings;
            this.isLoading = false;
            setTimeout(() => this.renderCharts(data.valueEvolution, data.purchasesByMonth), 0);
        });
    }

    private renderCharts(valueEvolution: InvestmentValuePoint[], purchasesByMonth: CryptoPurchaseMonth[]): void {
        this.renderDistribution();
        this.renderWalletEvolution(valueEvolution);
        this.renderBuyVolume(purchasesByMonth);
    }

    private renderDistribution(): void {
        if (this.holdings.length === 0) { this.distributionOptions = {}; return; }
        const tickers = this.holdings.map(h => h.assetName);
        const symbols = this.holdings.map(h => h.symbol);
        const values = this.holdings.map(h => h.actualValue);
        // formatValue explícito (2026-09-10): sin esto, pieOptions cae a su formateador default en
        // "en-US" (coma como separador de miles) en vez de la convención es-AR del resto de la sección.
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        this.distributionOptions = this.chartTheme.pieOptions(symbols, values, {
            formatTooltipName: (symbol, i) => `${tickers[i]} (${symbol})`,
            formatValue: fmt,
        });
    }

    private renderWalletEvolution(series: InvestmentValuePoint[]): void {
        if (series.length === 0) { this.walletEvolutionOptions = {}; return; }
        const labels = series.map(s => new Date(s.month).toLocaleDateString('es-AR'));
        const values = series.map(s => s.value);
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        this.walletEvolutionOptions = this.chartTheme.lineOptions(labels, values, { colorIndex: 2, formatValue: fmt });
    }

    private renderBuyVolume(purchasesByMonth: CryptoPurchaseMonth[]): void {
        this.hasPurchasesByMonth = purchasesByMonth.length > 0;
        if (purchasesByMonth.length === 0) { this.buyVolumeOptions = {}; return; }

        const groupedData: Record<string, Record<string, number>> = {};
        const commerceTypes = new Set<string>();

        purchasesByMonth.forEach(stat => {
            const month = new Date(stat.date).toLocaleString('default', { month: 'short', year: 'numeric' });
            if (!groupedData[month]) groupedData[month] = {};
            groupedData[month][stat.commerceType] = (groupedData[month][stat.commerceType] || 0) + stat.value;
            commerceTypes.add(stat.commerceType);
        });

        const labels = Object.keys(groupedData);
        const commerceTypesArray = Array.from(commerceTypes);
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        const axisLabel = this.chartTheme.surface.axisLabel;

        this.buyVolumeOptions = {
            color: commerceTypesArray.map((_, i) => this.chartTheme.colorAt(i)),
            legend: { top: 0, textStyle: { color: axisLabel } },
            grid: { left: 70, right: 20, top: 40, bottom: 40 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'category', data: labels, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series: commerceTypesArray.map(type => ({
                name: CryptosGralReportComponent.commerceTypeLabel.transform(type),
                type: 'bar',
                stack: 'total',
                data: labels.map(month => groupedData[month][type] || 0),
            })),
        };
    }
}
