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
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, ChartComponent, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe],
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
        private chartThemeService: ChartThemeService
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
            this.cryptoGralStatsDTO = response.cryptoGralStats;
            this.buildChartOptions(response);
        });
    }

    private buildChartOptions(data: CryptoGralStatsDTO): void {
        this.distributionOptions = this.buildDistributionOptions(data);
        this.walletEvolutionOptions = this.buildWalletEvolutionOptions(data);
        this.buyVolumeOptions = this.buildBuyVolumeOptions(data);
    }

    private buildDistributionOptions(data: CryptoGralStatsDTO): EChartsOption {
        const tooltipNames = new Map(data.cryptoGralStats.map(i => [i.symbol, `${i.assetName} (${i.symbol})`]));

        return {
            tooltip: {
                trigger: 'item',
                formatter: (params) => {
                    const p = params as { name: string; value: number; percent: number };
                    return `${tooltipNames.get(p.name) ?? p.name}: ${this.formatUsd(p.value)} (${p.percent}%)`;
                }
            },
            series: [{
                type: 'pie',
                radius: ['45%', '70%'],
                data: data.cryptoGralStats.map(i => ({ name: i.symbol, value: i.actualValue })),
                label: {
                    show: true,
                    position: 'inside',
                    color: '#fff',
                    formatter: (params) => {
                        const p = params as { name: string; percent: number };
                        return p.percent > 5 ? p.name : '';
                    }
                }
            }]
        };
    }

    private buildWalletEvolutionOptions(data: CryptoGralStatsDTO): EChartsOption {
        const labels = data.cryptoStatsByDate.map(i => new Date(i.date).toLocaleDateString('es-AR'));
        const values = data.cryptoStatsByDate.map(i => i.value);
        const color = this.chartThemeService.colorAt(0);

        return {
            tooltip: { trigger: 'axis', valueFormatter: (value) => this.formatUsd(Number(value)) },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: {
                type: 'category',
                data: labels,
                axisLabel: { interval: (index: number) => index % 2 === 0 }
            },
            yAxis: { type: 'value', scale: true, axisLabel: { formatter: (value: number) => this.formatUsd(value) } },
            series: [{
                type: 'line',
                data: values,
                showSymbol: false,
                areaStyle: {},
                lineStyle: { color, width: 1.5 },
                itemStyle: { color }
            }]
        };
    }

    private buildBuyVolumeOptions(data: CryptoGralStatsDTO): EChartsOption {
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

        const series = commerceTypesArray.map((type, index) => ({
            name: commerceTypeTranslations[type] || type,
            type: 'bar' as const,
            stack: 'total',
            data: labels.map(month => groupedData[month][type] || 0),
            itemStyle: { color: this.chartThemeService.colorAt(index) }
        }));

        return {
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => this.formatUsd(Number(value)) },
            legend: {},
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: labels },
            yAxis: { type: 'value', axisLabel: { formatter: (value: number) => this.formatUsd(value) } },
            series
        };
    }

    private formatUsd(value: number): string {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
}
