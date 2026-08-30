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
    balanceOptions: EChartsOption = {};

    constructor(
        private reportService: ReportService,
        private assetService: AssetService,
        private chartTheme: ChartThemeService
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
            this.viewAux = true;
            this.isLoadingGraph = false;
            setTimeout(() => this.renderCharts(response), 0);
        });
    }

    private renderCharts(data: CryptoStatsDTO): void {
        this.renderGauge(data);
        this.renderPriceEvolution(data);
        this.renderCryptoBalance(data);
    }

    private renderGauge(data: CryptoStatsDTO): void {
        const minValue = Number(data.cryptoRangeValuesStats.minValue.toFixed(2));
        const maxValue = Number(data.cryptoRangeValuesStats.maxValue.toFixed(2));
        const currentValue = Number(data.cryptoRangeValuesStats.currentValue.toFixed(2));
        const averageBuyValue = Number(data.cryptoRangeValuesStats.averageBuyValue.toFixed(2));
        const earnLostLine = (averageBuyValue - minValue) / (maxValue - minValue);
        const status = this.chartTheme.status;
        const axisLabel = this.chartTheme.surface.axisLabel;

        this.gaugeOptions = {
            series: [{
                type: 'gauge',
                startAngle: 200,
                endAngle: -20,
                min: minValue,
                max: maxValue,
                splitNumber: 4,
                radius: '110%',
                center: ['50%', '60%'],
                axisLine: { lineStyle: { width: 15, color: [[earnLostLine, status.critical], [1, status.good]] } },
                pointer: { length: '80%', width: 6 },
                detail: { formatter: '{value}', fontSize: 20, offsetCenter: [0, '60%'], color: axisLabel },
                data: [{ value: currentValue }]
            }]
        };
    }

    private renderPriceEvolution(data: CryptoStatsDTO): void {
        const labels = data.cryptoEvolutionStats.map(i => new Date(i.date).toLocaleDateString('es-AR'));
        const values = data.cryptoEvolutionStats.map(i => i.value);
        this.priceEvolutionOptions = this.chartTheme.lineOptions(labels, values, { colorIndex: 2 });
    }

    private renderCryptoBalance(data: CryptoStatsDTO): void {
        const cryptoAccounts = data.cryptoBalanceStats.map(i => i.account);
        const currentValues = data.cryptoBalanceStats.map(i => i.balance);
        this.balanceOptions = this.chartTheme.pieOptions(cryptoAccounts, currentValues);
    }
}
