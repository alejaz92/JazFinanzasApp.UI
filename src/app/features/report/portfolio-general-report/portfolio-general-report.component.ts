import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
Chart.register(...registerables);
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { PortfolioService } from '../../portfolios/services/portfolio.service';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { PortfolioStatsDTO } from '../../portfolios/models/portfolio-stats.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';

@Component({
    selector: 'app-portfolio-general-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe],
    templateUrl: './portfolio-general-report.component.html',
    styleUrl: './portfolio-general-report.component.css'
})
export class PortfolioGeneralReportComponent implements OnInit {
    isLoading = true;
    portfolios: PortfolioStatsDTO[] = [];
    mainReference: Asset | null = null;

    totalActualValue = 0;
    totalOriginalValue = 0;

    private valueByPortfolioChart: Chart | undefined;
    private distributionChart: Chart | undefined;
    private originalVsActualChart: Chart | undefined;

    constructor(
        private portfolioService: PortfolioService,
        private assetService: AssetService
    ) {}

    ngOnInit(): void {
        this.loadMainReference();
        this.loadPortfolios();
    }

    loadMainReference(): void {
        this.assetService.getReferenceAssets().subscribe((data: Asset[]) => {
            this.mainReference = data.find(x => x.isMainReference) ?? null;
        });
    }

    loadPortfolios(): void {
        this.portfolioService.getPortfolioStats().subscribe(response => {
            this.portfolios = [...response].sort((a, b) => b.actualValue - a.actualValue);
            this.totalActualValue = this.portfolios.reduce((sum, p) => sum + p.actualValue, 0);
            this.totalOriginalValue = this.portfolios.reduce((sum, p) => sum + p.originalValue, 0);
            this.isLoading = false;
            setTimeout(() => this.renderCharts(), 0);
        });
    }

    get totalGainLossPct(): number {
        return this.totalOriginalValue > 0 ? (this.totalActualValue / this.totalOriginalValue * 100) - 100 : 0;
    }

    gainLossPct(p: PortfolioStatsDTO): number {
        return p.originalValue > 0 ? (p.actualValue / p.originalValue * 100) - 100 : 0;
    }

    private renderCharts(): void {
        if (this.portfolios.length === 0) return;
        this.renderValueByPortfolio();
        this.renderDistribution();
        this.renderOriginalVsActual();
    }

    private renderValueByPortfolio(): void {
        const ctx = document.getElementById('valueByPortfolioChart') as HTMLCanvasElement;
        if (!ctx) return;
        this.valueByPortfolioChart?.destroy();

        const names = this.portfolios.map(p => p.portfolioName);
        const values = this.portfolios.map(p => p.actualValue);
        const colors = this.generateControlledColors(values.length);

        this.valueByPortfolioChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: names, datasets: [{ label: 'Valor Actual', data: values, backgroundColor: colors }] },
            options: {
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (tooltipItem) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(tooltipItem.raw))
                        }
                    }
                },
                scales: { x: { beginAtZero: true } }
            }
        });
    }

    private renderDistribution(): void {
        const ctx = document.getElementById('portfolioDistributionChart') as HTMLCanvasElement;
        if (!ctx) return;
        this.distributionChart?.destroy();

        const names = this.portfolios.map(p => p.portfolioName);
        const values = this.portfolios.map(p => p.actualValue);
        const colors = this.generateControlledColors(values.length);

        this.distributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: names, datasets: [{ data: values, backgroundColor: colors, hoverOffset: 4 }] },
            options: {
                plugins: {
                    legend: { display: true, position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: (tooltipItem) => {
                                const total = values.reduce((a, b) => a + b, 0);
                                const pct = total ? ((Number(tooltipItem.raw) / total) * 100).toFixed(2) : '0.00';
                                return `${names[tooltipItem.dataIndex]}: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(tooltipItem.raw))} (${pct}%)`;
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

    private renderOriginalVsActual(): void {
        const ctx = document.getElementById('originalVsActualByPortfolioChart') as HTMLCanvasElement;
        if (!ctx) return;
        this.originalVsActualChart?.destroy();

        const names = this.portfolios.map(p => p.portfolioName);

        this.originalVsActualChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: names,
                datasets: [
                    { label: 'Invertido', data: this.portfolios.map(p => p.originalValue), backgroundColor: 'rgba(255, 99, 132, 0.2)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 1 },
                    { label: 'Valor Actual', data: this.portfolios.map(p => p.actualValue), backgroundColor: 'rgba(75, 192, 192, 0.2)', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1 }
                ]
            },
            options: {
                scales: { y: { beginAtZero: true, ticks: { callback: (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v)) } } }
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
