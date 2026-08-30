import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { EChartsOption } from 'echarts';

import { ReportService } from '../services/report.service';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { CryptoGralStatsDTO } from '../models/CryptoGralStats.model';
import { StockStatsListDTO } from '../models/StockStats.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';

@Component({
    selector: 'app-cryptos-gral-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe, ChartComponent],
    templateUrl: './cryptos-gral-report.component.html',
    styleUrl: './cryptos-gral-report.component.css'
})
export class CryptosGralReportComponent implements OnInit {
    isLoadingGraph = false;
    includeStables = false;
    cryptoGralStatsDTO: StockStatsListDTO[] = [];
    mainReference: Asset | null = null;
    distributionOptions: EChartsOption = {};
    walletEvolutionOptions: EChartsOption = {};
    buyVolumeOptions: EChartsOption = {};

    constructor(
        private reportService: ReportService,
        private assetService: AssetService,
        private chartTheme: ChartThemeService
    ) {}

    ngOnInit(): void {
        this.loadMainReference();
        this.loadCryptoGralStats();
    }

    loadMainReference(): void {
        this.assetService.getReferenceAssets().subscribe((data: Asset[]) => {
            this.mainReference = data.find(x => x.isMainReference) ?? null;
        });
    }

    loadCryptoGralStats(): void {
        this.isLoadingGraph = true;
        this.reportService.getCryptoGralStats(this.includeStables).subscribe(response => {
            this.isLoadingGraph = false;
            setTimeout(() => {
                this.cryptoGralStatsDTO = response.cryptoGralStats;
                this.renderCharts(response);
            }, 0);
        });
    }

    private renderCharts(data: CryptoGralStatsDTO): void {
        this.renderDistribution(data);
        this.renderWalletEvolution(data);
        this.renderBuyVolume(data);
    }

    private renderDistribution(data: CryptoGralStatsDTO): void {
        const tickers = data.cryptoGralStats.map(i => i.assetName);
        const symbols = data.cryptoGralStats.map(i => i.symbol);
        const currentValues = data.cryptoGralStats.map(i => i.actualValue);
        this.distributionOptions = this.chartTheme.pieOptions(symbols, currentValues, {
            formatTooltipName: (symbol, i) => `${tickers[i]} (${symbol})`,
        });
    }

    private renderWalletEvolution(data: CryptoGralStatsDTO): void {
        const labels = data.cryptoStatsByDate.map(i => new Date(i.date).toLocaleDateString('es-AR'));
        const values = data.cryptoStatsByDate.map(i => i.value);
        this.walletEvolutionOptions = this.chartTheme.lineOptions(labels, values, { colorIndex: 2 });
    }

    private renderBuyVolume(data: CryptoGralStatsDTO): void {
        const commerceTypeTranslations: Record<string, string> = {
            'BalanceAdj': 'Ajuste de Saldos',
            'Trading': 'Trading',
            'Fiat/Crypto Commerce': 'Comercio Fiat/Crypto'
        };

        const groupedData: Record<string, Record<string, number>> = {};
        const commerceTypes = new Set<string>();

        data.cryptoPurchasesStatsByMonth.forEach(stat => {
            const month = new Date(stat.date).toLocaleString('default', { month: 'short', year: 'numeric' });
            if (!groupedData[month]) groupedData[month] = {};
            groupedData[month][stat.commerceType] = (groupedData[month][stat.commerceType] || 0) + stat.value;
            commerceTypes.add(stat.commerceType);
        });

        const labels = Object.keys(groupedData);
        const commerceTypesArray = Array.from(commerceTypes);
        const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
        const axisLabel = this.chartTheme.surface.axisLabel;

        this.buyVolumeOptions = {
            color: commerceTypesArray.map((_, i) => this.chartTheme.colorAt(i)),
            legend: { top: 0, textStyle: { color: axisLabel } },
            grid: { left: 70, right: 20, top: 40, bottom: 40 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'category', data: labels, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series: commerceTypesArray.map(type => ({
                name: commerceTypeTranslations[type] || type,
                type: 'bar',
                stack: 'total',
                data: labels.map(month => groupedData[month][type] || 0),
            })),
        };
    }
}
