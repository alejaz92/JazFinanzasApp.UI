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
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';

@Component({
    selector: 'app-stocks-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, ChartComponent, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe],
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

    stocksGralOptions: EChartsOption = {};
    percentajeByTickerOptions: EChartsOption = {};
    origVsActualOptions: EChartsOption = {};

    constructor(
        private reportService: ReportService,
        private assetTypeService: AssetTypeService,
        private assetService: AssetService
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
            this.buildChartOptions(response);
            this.stocksStatsDTO = response.stockStatsInd;
            this.viewAux = true;
        });
    }

    private buildChartOptions(data: StockStatsDTO): void {
        this.percentajeByTickerOptions = this.buildPieOptions(
            data.stockStatsInd.map(i => ({ name: i.symbol, tooltipName: `${i.assetName} (${i.symbol})`, value: i.actualValue }))
        );
        this.stocksGralOptions = this.buildPieOptions(
            data.stockStatsGral.map(i => ({ name: i.assetType, tooltipName: i.assetType, value: i.actualValue }))
        );
        this.origVsActualOptions = this.buildOrigVsActualOptions(data);
    }

    private buildPieOptions(data: { name: string; tooltipName: string; value: number }[]): EChartsOption {
        const tooltipNames = new Map(data.map(d => [d.name, d.tooltipName]));

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
                data: data.map(d => ({ name: d.name, value: d.value })),
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

    private buildOrigVsActualOptions(data: StockStatsDTO): EChartsOption {
        const symbols = data.stockStatsInd.map(i => i.symbol);

        return {
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => this.formatUsd(Number(value)) },
            legend: {},
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: symbols },
            yAxis: { type: 'value', axisLabel: { formatter: (value: number) => this.formatUsd(value) } },
            series: [
                { name: 'Valores Originales Promedio', type: 'bar', data: data.stockStatsInd.map(i => i.originalValue) },
                { name: 'Valores Actuales', type: 'bar', data: data.stockStatsInd.map(i => i.actualValue) }
            ]
        };
    }

    private formatUsd(value: number): string {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
}
