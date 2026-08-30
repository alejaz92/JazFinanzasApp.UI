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
    imports: [LoadingComponent, NgIf, NgFor, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe, ChartComponent],
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
    distributionOptions: EChartsOption = {};
    originalVsActualOptions: EChartsOption = {};

    constructor(
        private portfolioService: PortfolioService,
        private assetService: AssetService,
        private chartTheme: ChartThemeService
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
        const names = this.portfolios.map(p => p.portfolioName);
        const values = this.portfolios.map(p => p.actualValue);
        const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
        const axisLabel = this.chartTheme.surface.axisLabel;

        this.valueByPortfolioOptions = {
            grid: { left: 100, right: 30, top: 20, bottom: 30 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            yAxis: { type: 'category', data: names, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            series: [{
                type: 'bar',
                data: values,
                itemStyle: { color: (p: any) => this.chartTheme.colorAt(p.dataIndex) },
            }],
        };
    }

    private renderDistribution(): void {
        const names = this.portfolios.map(p => p.portfolioName);
        const values = this.portfolios.map(p => p.actualValue);
        this.distributionOptions = this.chartTheme.pieOptions(names, values, { donut: true, showLegend: true });
    }

    private renderOriginalVsActual(): void {
        const names = this.portfolios.map(p => p.portfolioName);
        const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
        const axisLabel = this.chartTheme.surface.axisLabel;

        this.originalVsActualOptions = {
            color: [this.chartTheme.colorAt(1), this.chartTheme.colorAt(0)],
            legend: { top: 0, textStyle: { color: axisLabel } },
            grid: { left: 70, right: 20, top: 40, bottom: 40 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'category', data: names, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series: [
                { name: 'Invertido', type: 'bar', data: this.portfolios.map(p => p.originalValue) },
                { name: 'Valor Actual', type: 'bar', data: this.portfolios.map(p => p.actualValue) },
            ],
        };
    }
}
