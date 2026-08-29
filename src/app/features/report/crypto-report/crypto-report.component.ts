import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { EChartsOption } from 'echarts';

import { ReportService } from '../services/report.service';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { CryptoStatsDTO, InvestmentTransactionsStatsDTO } from '../models/CryptoStats.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { MovementTypePipe } from '../../../shared/pipes/movementType/movement-type.pipe';
import { CommerceTypePipe } from '../../../shared/pipes/commerceType/commerce-type.pipe';

@Component({
    selector: 'app-crypto-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, DatePipe, ChartComponent, CurrencyFiatFormatPipe, MovementTypePipe, CommerceTypePipe],
    templateUrl: './crypto-report.component.html',
    styleUrl: './crypto-report.component.css'
})
export class CryptoReportComponent implements OnInit {
    isLoading = true;
    isLoadingGraph = false;
    viewAux = false;
    selectedCryptoDB6 = 0;
    cryptos: Asset[] = [];
    cryptoTransactionsStatsDTO: InvestmentTransactionsStatsDTO[] = [];
    mainReference: Asset | null = null;

    gaugeOptions: EChartsOption = {};
    priceEvolutionOptions: EChartsOption = {};
    cryptoBalanceOptions: EChartsOption = {};

    constructor(
        private reportService: ReportService,
        private assetService: AssetService,
        private chartThemeService: ChartThemeService
    ) {}

    ngOnInit(): void {
        this.loadCryptos();
        this.loadMainReference();
    }

    loadCryptos(): void {
        this.assetService.getAssetsByTypeName('Criptomoneda').subscribe(response => {
            this.cryptos = response;
            this.isLoading = false;
        });
    }

    loadMainReference(): void {
        this.assetService.getReferenceAssets().subscribe((data: Asset[]) => {
            this.mainReference = data.find(x => x.isMainReference) ?? null;
        });
    }

    loadCryptoStats(): void {
        if (this.selectedCryptoDB6 == 0) {
            this.viewAux = false;
            return;
        }
        this.isLoadingGraph = true;

        this.reportService.getCryptoStats(this.selectedCryptoDB6).subscribe(response => {
            this.cryptoTransactionsStatsDTO = response.cryptoTransactionsStats;
            this.buildChartOptions(response);
            this.viewAux = true;
            this.isLoadingGraph = false;
        });
    }

    private buildChartOptions(data: CryptoStatsDTO): void {
        this.gaugeOptions = this.buildGaugeOptions(data);
        this.priceEvolutionOptions = this.buildPriceEvolutionOptions(data);
        this.cryptoBalanceOptions = this.buildCryptoBalanceOptions(data);
    }

    private buildGaugeOptions(data: CryptoStatsDTO): EChartsOption {
        const minValue = data.cryptoRangeValuesStats.minValue.toFixed(2);
        const maxValue = data.cryptoRangeValuesStats.maxValue.toFixed(2);
        const currentValue = data.cryptoRangeValuesStats.currentValue.toFixed(2);
        const averageBuyValue = data.cryptoRangeValuesStats.averageBuyValue.toFixed(2);
        const earnLostLine = (Number(averageBuyValue) - Number(minValue)) / (Number(maxValue) - Number(minValue));
        const semantic = this.chartThemeService.semantic;

        return {
            series: [{
                type: 'gauge',
                startAngle: 200,
                endAngle: -20,
                min: Number(minValue),
                max: Number(maxValue),
                splitNumber: 4,
                radius: '110%',
                center: ['50%', '60%'],
                axisLine: { lineStyle: { width: 15, color: [[earnLostLine, semantic.loss], [1, semantic.gain]] } },
                axisLabel: { color: this.chartThemeService.textColor },
                pointer: { length: '80%', width: 6 },
                detail: { formatter: '{value}', fontSize: 20, offsetCenter: [0, '60%'], color: this.chartThemeService.textColor },
                data: [{ value: Number(currentValue) }]
            }]
        };
    }

    private buildPriceEvolutionOptions(data: CryptoStatsDTO): EChartsOption {
        const labels = data.cryptoEvolutionStats.map(i => new Date(i.date).toLocaleDateString('es-AR'));
        const values = data.cryptoEvolutionStats.map(i => i.value);
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

    private buildCryptoBalanceOptions(data: CryptoStatsDTO): EChartsOption {
        const cryptoAccounts = data.cryptoBalanceStats.map(i => i.account);
        const currentValues = data.cryptoBalanceStats.map(i => i.balance);

        return {
            tooltip: {
                trigger: 'item',
                formatter: (params) => {
                    const p = params as { name: string; value: number; percent: number };
                    return `${p.name}: ${this.formatUsd(p.value)} (${p.percent}%)`;
                }
            },
            series: [{
                type: 'pie',
                radius: ['45%', '70%'],
                data: cryptoAccounts.map((name, i) => ({ name, value: currentValues[i] })),
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

    private formatUsd(value: number): string {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
}
