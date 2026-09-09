import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type { EChartsOption } from 'echarts';

import { InvestmentReportService } from '../services/investment-report.service';
import { PortfolioOverviewItem, PortfolioDetailReport, PortfolioHoldingItem, InvestmentValuePoint } from '../models/investment-report.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';

interface HoldingGroup {
    key: string;
    assetType: string;
    assetName: string;
    symbol: string;
    quantity: number;
    originalValue: number;
    actualValue: number;
    gainLossPercent: number | null;
    accounts: PortfolioHoldingItem[];
}

// Carteras — Detalle (Fase 20, Flujo 5): reescrita sobre InvestmentReportController (Fase 19).
// El interruptor de agregado/desagregado desaparece (sección 8 del plan): la tabla siempre agrupa
// por activo, y cada fila se abre con un clic para ver el desglose por cuenta — mismo patrón que
// SharedExpenseDashboardComponent.toggleExpand. `portfolioId` vive en el query param de la URL
// (T12: enlace que se puede compartir), no en un estado local suelto.
@Component({
    selector: 'app-portfolio-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, NgClass, FormsModule, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe, ChartComponent],
    templateUrl: './portfolio-report.component.html',
    styleUrl: './portfolio-report.component.css'
})
export class PortfolioReportComponent {
    private readonly investmentReportService = inject(InvestmentReportService);
    private readonly chartTheme = inject(ChartThemeService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = true;
    isLoadingDetail = false;
    referenceAssetSymbol = '';
    portfolios: PortfolioOverviewItem[] = [];
    selectedPortfolioId = 0;
    detail: PortfolioDetailReport | null = null;
    holdingGroups: HoldingGroup[] = [];
    expandedKey: string | null = null;

    compositionOptions: EChartsOption = {};
    evolutionOptions: EChartsOption = {};

    private currentAssetId: number | null = null;

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId == null) return;
            this.currentAssetId = assetId;
            this.loadPortfolios(assetId);
            this.loadDetailIfReady();
        });

        this.route.queryParamMap.subscribe(params => {
            this.selectedPortfolioId = Number(params.get('portfolioId') ?? 0);
            this.loadDetailIfReady();
        });
    }

    private loadPortfolios(assetId: number): void {
        this.isLoading = true;
        this.investmentReportService.getPortfoliosOverview(assetId).subscribe(data => {
            this.referenceAssetSymbol = data.referenceAssetSymbol;
            this.portfolios = data.portfolios;
            this.isLoading = false;
        });
    }

    onPortfolioChange(): void {
        this.router.navigate([], { queryParams: { portfolioId: this.selectedPortfolioId || null }, queryParamsHandling: 'merge', replaceUrl: true });
    }

    private loadDetailIfReady(): void {
        if (this.selectedPortfolioId === 0 || this.currentAssetId == null) {
            this.detail = null;
            this.holdingGroups = [];
            return;
        }

        this.isLoadingDetail = true;
        this.investmentReportService.getPortfolioDetail(this.selectedPortfolioId, this.currentAssetId).subscribe(detail => {
            this.isLoadingDetail = false;
            this.detail = detail;
            this.holdingGroups = this.groupByAsset(detail.holdings);
            this.expandedKey = null;
            setTimeout(() => this.renderCharts(detail), 0);
        });
    }

    toggleExpand(key: string): void {
        this.expandedKey = this.expandedKey === key ? null : key;
    }

    private groupByAsset(holdings: PortfolioHoldingItem[]): HoldingGroup[] {
        const map = new Map<string, HoldingGroup>();
        for (const h of holdings) {
            const key = `${h.assetType}|${h.assetName}|${h.symbol}`;
            let group = map.get(key);
            if (!group) {
                group = { key, assetType: h.assetType, assetName: h.assetName, symbol: h.symbol, quantity: 0, originalValue: 0, actualValue: 0, gainLossPercent: null, accounts: [] };
                map.set(key, group);
            }
            group.quantity += h.quantity;
            group.originalValue += h.originalValue;
            group.actualValue += h.actualValue;
            group.accounts.push(h);
        }

        const groups = Array.from(map.values());
        for (const g of groups) g.gainLossPercent = g.originalValue > 0 ? (g.actualValue / g.originalValue * 100) - 100 : null;
        return groups.sort((a, b) => b.actualValue - a.actualValue);
    }

    private renderCharts(detail: PortfolioDetailReport): void {
        this.renderComposition();
        this.renderEvolution(detail.valueSeries);
    }

    private renderComposition(): void {
        const items = this.holdingGroups.map(g => ({ name: g.symbol, value: g.actualValue, gainLossPercent: g.gainLossPercent }));
        this.compositionOptions = this.chartTheme.treemapOptions(items, { formatValue: v => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 }) });
    }

    private renderEvolution(series: InvestmentValuePoint[]): void {
        const labels = series.map(s => new Date(s.month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));
        const values = series.map(s => s.value);
        this.evolutionOptions = this.chartTheme.lineOptions(labels, values, { colorIndex: 6, smooth: true, skipLabels: false });
    }
}
