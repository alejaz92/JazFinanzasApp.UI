import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { EChartsOption } from 'echarts';

import { ReportService } from '../services/report.service';
import { AssetTypeService } from '../../assetType/services/asset-type.service';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { AssetType } from '../../account/models/assetType.model';
import { StockStatsDTO, StockStatsListDTO } from '../models/StockStats.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';

@Component({
    selector: 'app-stocks-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe, ChartComponent],
    templateUrl: './stocks-report.component.html',
    styleUrl: './stocks-report.component.css'
})
export class StocksReportComponent implements OnInit {
    isLoading = true;
    isLoadingGraph = false;
    viewAux = false;
    selectedAssetTypeDB4 = 0;
    assetTypes: AssetType[] = [];
    stocksStatsDTO: StockStatsListDTO[] = [];
    mainReference: Asset | null = null;
    distributionByTickerOptions: EChartsOption = {};
    origVsActualOptions: EChartsOption = {};
    stocksGralOptions: EChartsOption = {};

    constructor(
        private reportService: ReportService,
        private assetTypeService: AssetTypeService,
        private assetService: AssetService,
        private chartTheme: ChartThemeService
    ) {}

    ngOnInit(): void {
        this.loadAssetTypes();
        this.loadMainReference();
    }

    loadAssetTypes(): void {
        this.assetTypeService.getAssetTypes('BOLSA').subscribe(response => {
            this.assetTypes = response;
            this.isLoading = false;
        });
    }

    loadMainReference(): void {
        this.assetService.getReferenceAssets().subscribe((data: Asset[]) => {
            this.mainReference = data.find(x => x.isMainReference) ?? null;
        });
    }

    loadStockStats(): void {
        if (this.selectedAssetTypeDB4 == 0) {
            this.viewAux = false;
            return;
        }
        this.stocksStatsDTO = [];
        this.viewAux = false;
        this.isLoadingGraph = true;

        this.reportService.getStockStats(this.selectedAssetTypeDB4).subscribe(response => {
            this.isLoadingGraph = false;
            this.viewAux = true;
            setTimeout(() => {
                this.renderCharts(response);
                this.stocksStatsDTO = response.stockStatsInd;
            }, 0);
        });
    }

    private renderCharts(data: StockStatsDTO): void {
        this.renderDistributionByTicker(data);
        this.renderOrigVsActual(data);
        this.renderStocksGral(data);
    }

    private renderDistributionByTicker(data: StockStatsDTO): void {
        const tickers = data.stockStatsInd.map(i => i.assetName);
        const symbols = data.stockStatsInd.map(i => i.symbol);
        const currentValues = data.stockStatsInd.map(i => i.actualValue);
        this.distributionByTickerOptions = this.chartTheme.pieOptions(symbols, currentValues, {
            formatTooltipName: (symbol, i) => `${tickers[i]} (${symbol})`,
        });
    }

    private renderOrigVsActual(data: StockStatsDTO): void {
        const symbols = data.stockStatsInd.map(i => i.symbol);
        const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
        const axisLabel = this.chartTheme.surface.axisLabel;

        this.origVsActualOptions = {
            color: [this.chartTheme.colorAt(1), this.chartTheme.colorAt(0)],
            legend: { top: 0, textStyle: { color: axisLabel } },
            grid: { left: 70, right: 20, top: 40, bottom: 40 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'category', data: symbols, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series: [
                { name: 'Valores Originales Promedio', type: 'bar', data: data.stockStatsInd.map(i => i.originalValue) },
                { name: 'Valores Actuales', type: 'bar', data: data.stockStatsInd.map(i => i.actualValue) },
            ],
        };
    }

    private renderStocksGral(data: StockStatsDTO): void {
        const assetTypes = data.stockStatsGral.map(i => i.assetType);
        const gralValues = data.stockStatsGral.map(i => i.actualValue);
        this.stocksGralOptions = this.chartTheme.pieOptions(assetTypes, gralValues);
    }
}
