import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { EChartsOption } from 'echarts';

import { InvestmentReportService } from '../services/investment-report.service';
import { StockTickerReport, ClosedPosition } from '../models/investment-report.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';

type SortColumn = 'assetTypeName' | 'tickerCount' | 'actualValue' | 'gainLossPercent';

interface TypeGroup {
    key: string;
    assetTypeName: string;
    tickerCount: number;
    originalValue: number;
    actualValue: number;
    gainLossPercent: number | null;
    tickers: StockTickerReport[];
}

// Bolsa — General (revisión 2026-09-12, Fase 20b, Flujo 5): reescrita sobre las Fase 19/20a.
// Reemplaza las barras divergentes + dispersión de 30 tickers por el corte que la pantalla vieja
// tenía y la reescritura de la Fase 20 había perdido — el tipo de activo — con un mapa de bloques
// en dos niveles, una evolución de 12 meses por tipo, rendimiento por tipo y una tabla agrupada con
// filas que se abren, en vez de una lista plana. D-10: cubre todo el entorno BOLSA (con los bonos).
@Component({
    selector: 'app-stocks-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, NgClass, DatePipe, RouterLink, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe, ChartComponent],
    templateUrl: './stocks-report.component.html',
    styleUrl: './stocks-report.component.css'
})
export class StocksReportComponent {
    private readonly investmentReportService = inject(InvestmentReportService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = true;
    referenceAssetSymbol = '';
    totalOriginalValue = 0;
    totalActualValue = 0;
    tickers: StockTickerReport[] = [];
    closedPositions: ClosedPosition[] = [];
    groups: TypeGroup[] = [];
    expandedKey: string | null = null;

    sortColumn: SortColumn = 'actualValue';
    sortDirection: 'asc' | 'desc' = 'desc';

    treemapOptions: EChartsOption = {};
    evolutionOptions: EChartsOption = {};
    typeGainLossOptions: EChartsOption = {};
    tickerGainLossOptions: EChartsOption = {};

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            const assetTypeId = this.reportContext.selectedStockTypeId() ?? 0;
            const includeClosed = this.reportContext.includeClosedPositions();
            if (assetId != null) this.load(assetId, assetTypeId, includeClosed);
        });
    }

    get totalGainLossPct(): number | null {
        return this.totalOriginalValue > 0 ? (this.totalActualValue / this.totalOriginalValue * 100) - 100 : null;
    }

    private load(assetId: number, assetTypeId: number, includeClosed: boolean): void {
        this.isLoading = true;
        this.investmentReportService.getStocks(assetId, assetTypeId, includeClosed).subscribe(data => {
            this.referenceAssetSymbol = data.referenceAssetSymbol;
            this.totalOriginalValue = data.totalOriginalValue;
            this.totalActualValue = data.totalActualValue;
            this.tickers = data.tickers;
            this.closedPositions = data.closedPositions;
            this.groups = this.buildGroups(data.tickers);
            this.applySort();
            this.expandedKey = null;
            this.isLoading = false;
            setTimeout(() => {
                this.renderTreemap();
                this.renderEvolution(data.valueSeries);
                this.renderTypeGainLoss(data.types);
                this.renderTickerGainLoss();
            }, 0);
        });
    }

    toggleExpand(key: string): void {
        this.expandedKey = this.expandedKey === key ? null : key;
    }

    sortBy(column: SortColumn): void {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = column === 'assetTypeName' ? 'asc' : 'desc';
        }
        this.applySort();
    }

    private applySort(): void {
        const dir = this.sortDirection === 'asc' ? 1 : -1;
        const col = this.sortColumn;
        this.groups = [...this.groups].sort((a, b) => {
            if (col === 'assetTypeName') return a.assetTypeName.localeCompare(b.assetTypeName) * dir;
            const av = a[col] ?? -Infinity;
            const bv = b[col] ?? -Infinity;
            return (av - bv) * dir;
        });
    }

    private buildGroups(tickers: StockTickerReport[]): TypeGroup[] {
        const map = new Map<string, TypeGroup>();
        for (const t of tickers) {
            let group = map.get(t.assetTypeName);
            if (!group) {
                group = { key: t.assetTypeName, assetTypeName: t.assetTypeName, tickerCount: 0, originalValue: 0, actualValue: 0, gainLossPercent: null, tickers: [] };
                map.set(t.assetTypeName, group);
            }
            group.tickerCount++;
            group.originalValue += t.originalValue;
            group.actualValue += t.actualValue;
            group.tickers.push(t);
        }
        const groups = Array.from(map.values());
        for (const g of groups) g.gainLossPercent = g.originalValue > 0 ? (g.actualValue / g.originalValue * 100) - 100 : null;
        return groups;
    }

    private renderTreemap(): void {
        if (this.groups.length === 0) { this.treemapOptions = {}; return; }
        const groups = this.groups.map(g => ({
            name: g.assetTypeName,
            items: g.tickers.map(t => ({ name: t.symbol, value: t.actualValue, gainLossPercent: t.gainLossPercent })),
        }));
        this.treemapOptions = this.chartTheme.groupedTreemapOptions(groups, { formatValue: v => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 }) });
    }

    private renderEvolution(series: { month: string; byType: { assetTypeName: string; value: number }[] }[]): void {
        if (series.length === 0) { this.evolutionOptions = {}; return; }
        const labels = series.map(p => new Date(p.month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));
        const typeNames = Array.from(new Set(series.flatMap(p => p.byType.map(t => t.assetTypeName))));
        const chartSeries = typeNames.map(name => ({
            name,
            values: series.map(p => p.byType.find(t => t.assetTypeName === name)?.value ?? 0),
        }));
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        this.evolutionOptions = this.chartTheme.stackedAreaOptions(labels, chartSeries, { formatValue: fmt });
    }

    private renderTypeGainLoss(types: { assetTypeName: string; gainLossPercent: number | null }[]): void {
        if (types.length === 0) { this.typeGainLossOptions = {}; return; }
        const sorted = [...types].sort((a, b) => (a.gainLossPercent ?? 0) - (b.gainLossPercent ?? 0));
        const labels = sorted.map(t => t.assetTypeName);
        const values = sorted.map(t => t.gainLossPercent ?? 0);
        const fmt = (v: number) => `${this.chartTheme.formatNumber(v, { maximumFractionDigits: 1 })} %`;
        this.typeGainLossOptions = this.chartTheme.divergingBarOptions(labels, values, { formatValue: fmt });
    }

    private renderTickerGainLoss(): void {
        if (this.tickers.length === 0) { this.tickerGainLossOptions = {}; return; }
        const sorted = [...this.tickers].sort((a, b) => a.gainLossAmount - b.gainLossAmount);
        // D-12: las 5 mejores y las 5 peores, no las 30 — con 10 o menos, se muestran todas.
        const picked = sorted.length > 10 ? [...sorted.slice(0, 5), ...sorted.slice(-5)] : sorted;
        const labels = picked.map(t => t.symbol);
        const values = picked.map(t => t.gainLossAmount);
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        this.tickerGainLossOptions = this.chartTheme.divergingBarOptions(labels, values, { formatValue: fmt });
    }
}
