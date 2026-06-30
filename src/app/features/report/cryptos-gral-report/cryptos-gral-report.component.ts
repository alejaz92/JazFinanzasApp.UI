import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
Chart.register(...registerables);
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { ReportService } from '../services/report.service';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { CryptoGralStatsDTO } from '../models/CryptoGralStats.model';
import { StockStatsListDTO } from '../models/StockStats.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';

@Component({
    selector: 'app-cryptos-gral-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe],
    templateUrl: './cryptos-gral-report.component.html',
    styleUrl: './cryptos-gral-report.component.css'
})
export class CryptosGralReportComponent implements OnInit {
    isLoadingGraph = false;
    includeStables = false;
    cryptoGralStatsDTO: StockStatsListDTO[] = [];
    mainReference: Asset | null = null;

    private db5Graph1: Chart | undefined;
    private db5Graph2: Chart | undefined;
    private db5Graph3: Chart | undefined;

    constructor(
        private reportService: ReportService,
        private assetService: AssetService
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
        const ctx = document.getElementById('cryptosGralDistributionChart') as HTMLCanvasElement;
        if (!ctx) return;
        this.db5Graph1?.destroy();

        const tickers = data.cryptoGralStats.map(i => i.assetName);
        const symbols = data.cryptoGralStats.map(i => i.symbol);
        const currentValues = data.cryptoGralStats.map(i => i.actualValue);
        const colors = this.generateControlledColors(currentValues.length);

        this.db5Graph1 = new Chart(ctx, {
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

    private renderWalletEvolution(data: CryptoGralStatsDTO): void {
        const ctx = document.getElementById('walletValueEvolutionChart') as HTMLCanvasElement;
        if (!ctx) return;
        this.db5Graph2?.destroy();

        const labels = data.cryptoStatsByDate.map(i => new Date(i.date).toLocaleDateString('es-AR'));
        const values = data.cryptoStatsByDate.map(i => i.value);

        this.db5Graph2 = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{ label: 'Valor de la Cartera', data: values, fill: true, borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1.5, pointRadius: 0 }] },
            options: {
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (t) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(t.raw)) } }
                },
                scales: {
                    x: { ticks: { callback: function(value, index) { return index % 2 === 0 ? this.getLabelForValue(Number(value)) : ''; } } },
                    y: { beginAtZero: false, ticks: { callback: (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v)) } }
                }
            }
        });
    }

    private renderBuyVolume(data: CryptoGralStatsDTO): void {
        const ctx = document.getElementById('buyVolumeEvolutionChart') as HTMLCanvasElement;
        if (!ctx) return;
        this.db5Graph3?.destroy();

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
        const colors = this.generateControlledColors(commerceTypesArray.length);

        const datasets = commerceTypesArray.map((type, index) => ({
            label: commerceTypeTranslations[type] || type,
            data: labels.map(month => groupedData[month][type] || 0),
            backgroundColor: colors[index]
        }));

        this.db5Graph3 = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets },
            options: {
                responsive: true,
                plugins: {
                    tooltip: { callbacks: { label: (t) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(t.raw)) } },
                    legend: { position: 'top' }
                },
                scales: {
                    x: { stacked: true },
                    y: { beginAtZero: false, ticks: { callback: (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v)) } }
                }
            }
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
