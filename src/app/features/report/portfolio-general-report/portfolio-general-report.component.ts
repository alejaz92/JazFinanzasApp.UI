import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { EChartsOption } from 'echarts';

import { InvestmentReportService } from '../services/investment-report.service';
import { PortfolioOverviewItem } from '../models/investment-report.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';

// Carteras — General (Fase 20, Flujo 5): reescrita sobre InvestmentReportController (Fase 19) en
// vez de PortfolioService.getPortfolioStats — mismo dato de fondo (GetPortfolioStatsAsync), pero
// con el assetId de la barra de Reportes (T12) en vez del principal resuelto por Asset_User, y con
// SharePercent/GainLossPercent ya calculados por el backend. Dos gráficos, no tres: la barra de
// "valor actual por cartera" sola era redundante con la serie "Valor Actual" de Invertido vs Actual.
@Component({
    selector: 'app-portfolio-general-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, RouterLink, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe, ChartComponent],
    templateUrl: './portfolio-general-report.component.html',
    styleUrl: './portfolio-general-report.component.css'
})
export class PortfolioGeneralReportComponent {
    private readonly investmentReportService = inject(InvestmentReportService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = true;
    // Switch de Carteras — General/Detalle (2026-09-10): una cartera mezcla efectivo e inversión por
    // diseño (1.3 del plan) — apagarlo muestra solo lo realmente invertido, mismo criterio que ya
    // usan Panorama/Bolsa/Cryptos. Arranca prendido para no cambiar el comportamiento existente.
    includeCash = true;
    referenceAssetSymbol = '';
    portfolios: PortfolioOverviewItem[] = [];
    totalActualValue = 0;
    totalOriginalValue = 0;

    distributionOptions: EChartsOption = {};
    originalVsActualOptions: EChartsOption = {};

    private currentAssetId: number | null = null;

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) {
                this.currentAssetId = assetId;
                this.load(assetId);
            }
        });
    }

    onIncludeCashChange(): void {
        if (this.currentAssetId != null) this.load(this.currentAssetId);
    }

    private load(assetId: number): void {
        this.isLoading = true;
        this.investmentReportService.getPortfoliosOverview(assetId, this.includeCash).subscribe(data => {
            this.referenceAssetSymbol = data.referenceAssetSymbol;
            this.portfolios = [...data.portfolios].sort((a, b) => b.actualValue - a.actualValue);
            this.totalActualValue = this.portfolios.reduce((sum, p) => sum + p.actualValue, 0);
            this.totalOriginalValue = this.portfolios.reduce((sum, p) => sum + p.originalValue, 0);
            this.isLoading = false;
            setTimeout(() => this.renderCharts(), 0);
        });
    }

    get totalGainLossPct(): number | null {
        return this.totalOriginalValue > 0 ? (this.totalActualValue / this.totalOriginalValue * 100) - 100 : null;
    }

    private renderCharts(): void {
        if (this.portfolios.length === 0) return;
        this.renderDistribution();
        this.renderOriginalVsActual();
    }

    private renderDistribution(): void {
        const names = this.portfolios.map(p => p.portfolioName);
        const values = this.portfolios.map(p => p.actualValue);
        this.distributionOptions = this.chartTheme.pieOptions(names, values, { donut: true, showLegend: true });
    }

    private renderOriginalVsActual(): void {
        const names = this.portfolios.map(p => p.portfolioName);
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        const axisLabel = this.chartTheme.surface.axisLabel;

        this.originalVsActualOptions = {
            color: [this.chartTheme.colorAt(1), this.chartTheme.colorAt(0)],
            legend: { top: 0, textStyle: { color: axisLabel } },
            grid: { left: 70, right: 20, top: 40, bottom: 40 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'category', data: names, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series: [
                { name: 'Valor de Origen', type: 'bar', data: this.portfolios.map(p => p.originalValue) },
                { name: 'Valor Actual', type: 'bar', data: this.portfolios.map(p => p.actualValue) },
            ],
        };
    }
}
