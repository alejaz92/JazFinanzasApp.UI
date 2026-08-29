import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
Chart.register(...registerables);
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { ReportService } from '../services/report.service';
import { AssetTypeService } from '../../assetType/services/asset-type.service';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { AssetType } from '../../account/models/assetType.model';
import { StockStatsDTO, StockStatsListDTO } from '../models/StockStats.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';

@Component({
    selector: 'app-stocks-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe],
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

    private db4Graph1: Chart | undefined;
    private db4Graph2: Chart | undefined;
    private db4Graph3: Chart | undefined;

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
        const ctx = document.getElementById('percentajeByTickerChart') as HTMLCanvasElement;
        if (!ctx) return;
        this.db4Graph1?.destroy();

        const tickers = data.stockStatsInd.map(i => i.assetName);
        const symbols = data.stockStatsInd.map(i => i.symbol);
        const currentValues = data.stockStatsInd.map(i => i.actualValue);
        const colors = this.generateControlledColors(currentValues.length);

        this.db4Graph1 = new Chart(ctx, {
            type: 'pie',
            data: { labels: symbols, datasets: [{ data: currentValues, backgroundColor: colors, hoverOffset: 4 }] },
            options: {
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (tooltipItem) => {
                                const total = currentValues.reduce((a, b) => a + b, 0);
                                const pct = ((Number(tooltipItem.raw) / total) * 100).toFixed(2);
                                return `${tickers[tooltipItem.dataIndex]} (${symbols[tooltipItem.dataIndex]}): ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(tooltipItem.raw))} (${pct}%)`;
                            }
                        }
                    },
                    datalabels: {
                        display: true, color: 'white', align: 'center', anchor: 'center', font: { weight: 'bold' },
                        formatter: (value, context) => {
                            const total = (context.chart.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
                            const pct = total ? ((value / total) * 100).toFixed(2) : '0.00';
                            return Number(pct) > 5 && context.chart.data.labels ? context.chart.data.labels[context.dataIndex] : '';
                        }
                    }
                }
            } as ChartConfiguration['options'],
            plugins: [ChartDataLabels]
        });
    }

    private renderOrigVsActual(data: StockStatsDTO): void {
        const ctx = document.getElementById('origVsActualChart') as HTMLCanvasElement;
        if (!ctx) return;
        this.db4Graph2?.destroy();

        const symbols = data.stockStatsInd.map(i => i.symbol);
        this.db4Graph2 = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: symbols,
                datasets: [
                    { label: 'Valores Originales Promedio', data: data.stockStatsInd.map(i => i.originalValue), backgroundColor: 'rgba(255, 99, 132, 0.2)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 1 },
                    { label: 'Valores Actuales', data: data.stockStatsInd.map(i => i.actualValue), backgroundColor: 'rgba(75, 192, 192, 0.2)', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1 }
                ]
            },
            options: {
                scales: { y: { beginAtZero: true, ticks: { callback: (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v)) } } }
            }
        });
    }

    private renderStocksGral(data: StockStatsDTO): void {
        const ctx = document.getElementById('stocksGralChart') as HTMLCanvasElement;
        if (!ctx) return;
        this.db4Graph3?.destroy();

        const assetTypes = data.stockStatsGral.map(i => i.assetType);
        const gralValues = data.stockStatsGral.map(i => i.actualValue);
        const colors = this.generateControlledColors(gralValues.length);

        this.db4Graph3 = new Chart(ctx, {
            type: 'pie',
            data: { labels: assetTypes, datasets: [{ data: gralValues, backgroundColor: colors, hoverOffset: 4 }] },
            options: {
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (tooltipItem) => {
                                const total = gralValues.reduce((a, b) => a + b, 0);
                                const pct = ((Number(tooltipItem.raw) / total) * 100).toFixed(2);
                                return `${assetTypes[tooltipItem.dataIndex]}: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(tooltipItem.raw))} (${pct}%)`;
                            }
                        }
                    },
                    datalabels: {
                        display: true, color: 'white', align: 'center', anchor: 'center', font: { weight: 'bold' },
                        formatter: (value, context) => {
                            const total = (context.chart.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
                            const pct = total ? ((value / total) * 100).toFixed(2) : '0.00';
                            return Number(pct) > 5 && context.chart.data.labels ? context.chart.data.labels[context.dataIndex] : '';
                        }
                    }
                }
            } as ChartConfiguration['options'],
            plugins: [ChartDataLabels]
        });
    }

    private generateControlledColors(quantity: number): string[] {
        const colors = [];
        const step = 360 / quantity;
        for (let i = 0; i < quantity; i++) {
            const hue = Math.floor(i * step);
            const saturation = Math.floor(Math.random() * 30 + 70);
            const lightness = Math.floor(Math.random() * 20 + 40);
            colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        }
        return colors;
    }
}
