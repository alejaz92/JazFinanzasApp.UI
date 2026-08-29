import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { PortfolioService } from '../../portfolios/services/portfolio.service';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { PortfolioStatsDTO } from '../../portfolios/models/portfolio-stats.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';

@Component({
    selector: 'app-portfolio-general-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, ChartComponent, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe],
    templateUrl: './portfolio-general-report.component.html',
    styleUrl: './portfolio-general-report.component.css'
})
export class PortfolioGeneralReportComponent implements OnInit {
    isLoading = true;
    portfolios: PortfolioStatsDTO[] = [];
    mainReference: Asset | null = null;

    totalActualValue = 0;
    totalOriginalValue = 0;

    valueByPortfolioOptions: EChartsOption = {};
    portfolioDistributionOptions: EChartsOption = {};
    originalVsActualOptions: EChartsOption = {};

    constructor(
        private portfolioService: PortfolioService,
        private assetService: AssetService,
        private chartThemeService: ChartThemeService
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
            this.buildChartOptions();
        });
    }

    get totalGainLossPct(): number {
        return this.totalOriginalValue > 0 ? (this.totalActualValue / this.totalOriginalValue * 100) - 100 : 0;
    }

    gainLossPct(p: PortfolioStatsDTO): number {
        return p.originalValue > 0 ? (p.actualValue / p.originalValue * 100) - 100 : 0;
    }

    private buildChartOptions(): void {
        if (this.portfolios.length === 0) return;
        this.valueByPortfolioOptions = this.buildValueByPortfolioOptions();
        this.portfolioDistributionOptions = this.buildDistributionOptions();
        this.originalVsActualOptions = this.buildOriginalVsActualOptions();
    }

    private buildValueByPortfolioOptions(): EChartsOption {
        const names = this.portfolios.map(p => p.portfolioName);
        const values = this.portfolios.map((p, i) => ({
            value: p.actualValue,
            itemStyle: { color: this.chartThemeService.colorAt(i) }
        }));

        return {
            tooltip: {
                trigger: 'item',
                formatter: (params) => this.chartThemeService.formatCurrency(Number((params as { value: number }).value))
            },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'value' },
            yAxis: { type: 'category', data: names },
            series: [{ type: 'bar', data: values }]
        };
    }

    private buildDistributionOptions(): EChartsOption {
        const data = this.portfolios.map(p => ({ name: p.portfolioName, value: p.actualValue }));

        return {
            tooltip: {
                trigger: 'item',
                formatter: (params) => {
                    const p = params as { name: string; value: number; percent: number };
                    return `${p.name}: ${this.chartThemeService.formatCurrency(p.value)} (${p.percent}%)`;
                }
            },
            legend: { bottom: 0 },
            series: [{
                type: 'pie',
                radius: ['45%', '70%'],
                data,
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

    private buildOriginalVsActualOptions(): EChartsOption {
        const names = this.portfolios.map(p => p.portfolioName);

        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                valueFormatter: (value) => this.chartThemeService.formatCurrency(Number(value))
            },
            legend: {},
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: names },
            yAxis: {
                type: 'value',
                axisLabel: { formatter: (value: number) => this.chartThemeService.formatCurrency(value) }
            },
            series: [
                { name: 'Invertido', type: 'bar', data: this.portfolios.map(p => p.originalValue) },
                { name: 'Valor Actual', type: 'bar', data: this.portfolios.map(p => p.actualValue) }
            ]
        };
    }
}
