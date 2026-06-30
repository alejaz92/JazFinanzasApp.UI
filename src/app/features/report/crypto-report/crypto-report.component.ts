import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
Chart.register(...registerables);
import ChartDataLabels from 'chartjs-plugin-datalabels';
import * as echarts from 'echarts';

import { ReportService } from '../services/report.service';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { CryptoStatsDTO, InvestmentTransactionsStatsDTO } from '../models/CryptoStats.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { MovementTypePipe } from '../../../shared/pipes/movementType/movement-type.pipe';
import { CommerceTypePipe } from '../../../shared/pipes/commerceType/commerce-type.pipe';

@Component({
    selector: 'app-crypto-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, DatePipe, CurrencyFiatFormatPipe, MovementTypePipe, CommerceTypePipe],
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

    private db6Graph2: Chart | undefined;
    private db6Graph3: Chart | undefined;

    constructor(
        private reportService: ReportService,
        private assetService: AssetService
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
        const minValue = data.cryptoRangeValuesStats.minValue.toFixed(2);
        const maxValue = data.cryptoRangeValuesStats.maxValue.toFixed(2);
        const currentValue = data.cryptoRangeValuesStats.currentValue.toFixed(2);
        const averageBuyValue = data.cryptoRangeValuesStats.averageBuyValue.toFixed(2);
        const earnLostLine = (Number(averageBuyValue) - Number(minValue)) / (Number(maxValue) - Number(minValue));

        const chartDom = document.getElementById('gaugeChart');
        if (!chartDom) return;

        const existingChart = echarts.getInstanceByDom(chartDom);
        if (existingChart) existingChart.dispose();

        const myChart = echarts.init(chartDom);
        myChart.setOption({
            series: [{
                type: 'gauge',
                startAngle: 200,
                endAngle: -20,
                min: minValue,
                max: maxValue,
                splitNumber: 4,
                radius: '110%',
                center: ['50%', '60%'],
                axisLine: { lineStyle: { width: 15, color: [[earnLostLine, '#fd666d'], [1, '#67e0e3']] } },
                pointer: { length: '80%', width: 6 },
                detail: { formatter: '{value}', fontSize: 20, offsetCenter: [0, '60%'], color: '#333' },
                data: [{ value: currentValue }]
            }]
        });

        window.addEventListener('resize', () => myChart.resize());
    }

    private renderPriceEvolution(data: CryptoStatsDTO): void {
        const ctx = document.getElementById('priceEvolutionChart') as HTMLCanvasElement;
        if (!ctx) return;
        this.db6Graph2?.destroy();

        const labels = data.cryptoEvolutionStats.map(i => new Date(i.date).toLocaleDateString('es-AR'));
        const values = data.cryptoEvolutionStats.map(i => i.value);

        this.db6Graph2 = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{ label: 'Valor de la Criptomoneda', data: values, fill: true, borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1.5, pointRadius: 0 }] },
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

    private renderCryptoBalance(data: CryptoStatsDTO): void {
        const ctx = document.getElementById('cryptoBalanceChart') as HTMLCanvasElement;
        if (!ctx) return;
        this.db6Graph3?.destroy();

        const cryptoAccounts = data.cryptoBalanceStats.map(i => i.account);
        const currentValues = data.cryptoBalanceStats.map(i => i.balance);
        const colors = this.generateControlledColors(currentValues.length);

        this.db6Graph3 = new Chart(ctx, {
            type: 'pie',
            data: { labels: cryptoAccounts, datasets: [{ data: currentValues, backgroundColor: colors, borderWidth: 1 }] },
            options: {
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (tooltipItem) => {
                                const total = currentValues.reduce((a, b) => a + b, 0);
                                const pct = ((Number(tooltipItem.raw) / total) * 100).toFixed(2);
                                return `${cryptoAccounts[tooltipItem.dataIndex]}: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(tooltipItem.raw))} (${pct}%)`;
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
