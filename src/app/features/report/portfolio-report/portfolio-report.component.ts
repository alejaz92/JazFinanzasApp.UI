import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { InvestmentReportService } from '../services/investment-report.service';
import { PortfolioDetailReport, PortfolioHoldingItem, InvestmentValuePoint } from '../models/investment-report.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';
import { CurrencyQuoteFormatPipe } from '../../../shared/pipes/currencyQuoteFormat/currency-quote-format.pipe';

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

// Carteras — Detalle (Fase 20, Flujo 5; selector de cartera movido a la barra de filtros compartida
// el 2026-09-10, mismo criterio que "Por tarjeta" — antes vivía suelto en el cuerpo de esta pantalla,
// fuera de la barra). El interruptor de agregado/desagregado desaparece (sección 8 del plan): la
// tabla siempre agrupa por activo, y cada fila se abre con un clic para ver el desglose por cuenta —
// mismo patrón que SharedExpenseDashboardComponent.toggleExpand.
@Component({
    selector: 'app-portfolio-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, NgClass, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe, CurrencyQuoteFormatPipe, ChartComponent],
    templateUrl: './portfolio-report.component.html',
    styleUrl: './portfolio-report.component.css'
})
export class PortfolioReportComponent {
    private readonly investmentReportService = inject(InvestmentReportService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoadingDetail = true;
    detail: PortfolioDetailReport | null = null;
    holdingGroups: HoldingGroup[] = [];
    expandedKey: string | null = null;

    compositionOptions: EChartsOption = {};
    evolutionOptions: EChartsOption = {};

    constructor() {
        // Switch "Incluir efectivo" (2026-09-10): ver comentario homólogo en
        // PortfolioGeneralReportComponent — vive en la barra de filtros de reports-shell.
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            const portfolioId = this.reportContext.selectedPortfolioId();
            this.reportContext.includeCash();
            if (assetId == null || portfolioId == null) return;
            this.loadDetail(portfolioId, assetId);
        });
    }

    private loadDetail(portfolioId: number, assetId: number): void {
        this.isLoadingDetail = true;
        this.investmentReportService.getPortfolioDetail(portfolioId, assetId, this.reportContext.includeCash()).subscribe(detail => {
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
        // formatValue explícito (2026-09-10): sin esto, lineOptions cae a su formateador default en
        // "en-US" (coma como separador de miles) en vez de la convención es-AR del resto de la sección.
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        // Ahora comparte fila con la composición (mitad de ancho, ver corrección 2026-09-10): 12
        // etiquetas de mes se superponen si se muestran todas — mismo ajuste que Panorama.
        this.evolutionOptions = this.chartTheme.lineOptions(labels, values, { colorIndex: 6, smooth: true, formatValue: fmt });
    }
}
