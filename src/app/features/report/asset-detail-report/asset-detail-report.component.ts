import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { InvestmentReportService } from '../services/investment-report.service';
import { AssetDetailReport } from '../models/investment-report.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';
import { MovementTypePipe } from '../../../shared/pipes/movementType/movement-type.pipe';
import { CommerceTypePipe } from '../../../shared/pipes/commerceType/commerce-type.pipe';

// Bolsa — Detalle (revisión 2026-09-12, Fase 20b, D-15): mismo molde que Cryptos — Detalle
// (crypto-report/), sobre el endpoint genérico de detalle que la Fase 20a generalizó (T17) —
// cotización de 12 meses con mis compras y ventas marcadas encima y mi precio promedio de compra
// como línea horizontal. Le suma dos cosas que Cryptos — Detalle todavía no tiene: la marca de cada
// split con su leyenda (D-16) y "Mi Posición"/"Peso en Bolsa" (D-15) — Bolsa es la primera categoría
// de Inversiones donde el usuario puede volver a comprar/vender un activo que ya vendió del todo,
// así que saber la posición actual de un vistazo importa más acá que en cripto.
@Component({
    selector: 'app-asset-detail-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, DatePipe, ChartComponent, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe, MovementTypePipe, CommerceTypePipe],
    templateUrl: './asset-detail-report.component.html',
    styleUrl: './asset-detail-report.component.css'
})
export class AssetDetailReportComponent {
    private readonly investmentReportService = inject(InvestmentReportService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoadingDetail = true;
    detail: AssetDetailReport | null = null;

    priceOptions: EChartsOption = {};

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            const stockAssetId = this.reportContext.selectedStockAssetId();
            if (assetId == null || stockAssetId == null) return;
            this.loadDetail(stockAssetId, assetId);
        });
    }

    // Frase de la leyenda bajo el gráfico (D-16): una por split, para que quede claro por qué la
    // escala vieja no es la que se ve en el broker — nunca se ajusta en silencio.
    splitCaption(split: { date: string; splitRatio: number }): string {
        const date = new Date(split.date).toLocaleDateString('es-AR');
        return `Cotización ajustada por el split ${split.splitRatio}:1 del ${date}.`;
    }

    private loadDetail(stockAssetId: number, assetId: number): void {
        this.isLoadingDetail = true;
        this.investmentReportService.getAssetDetail(stockAssetId, assetId).subscribe(detail => {
            this.isLoadingDetail = false;
            this.detail = detail;
            setTimeout(() => this.renderPriceChart(detail), 0);
        });
    }

    private renderPriceChart(detail: AssetDetailReport): void {
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 2 });
        const status = this.chartTheme.status;

        const priceData = detail.priceEvolution.map(p => [new Date(p.month).getTime(), p.value]);
        const buys = detail.transactions.filter(t => t.movementType === 'I').map(t => [new Date(t.date).getTime(), t.quotePrice]);
        const sells = detail.transactions.filter(t => t.movementType === 'E').map(t => [new Date(t.date).getTime(), t.quotePrice]);

        // D-16: una línea vertical por split, con el ratio en el tooltip — encima de la marca
        // horizontal del precio promedio, en la misma serie de "Cotización".
        const splitLines = detail.splitEvents.map(s => ({
            xAxis: new Date(s.date).getTime(),
            name: `Split ${s.splitRatio}:1`,
            label: { formatter: `Split ${s.splitRatio}:1`, color: axisLabel, position: 'insideEndTop' as const },
        }));

        this.priceOptions = {
            color: [this.chartTheme.colorAt(2)],
            grid: { left: 70, right: 20, top: 20, bottom: 40 },
            tooltip: { trigger: 'axis', ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'time', axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', scale: true, axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series: [
                {
                    name: 'Cotización', type: 'line', data: priceData, showSymbol: false, lineStyle: { width: 1.5 }, areaStyle: { opacity: 0.1 },
                    markLine: {
                        silent: true, symbol: 'none',
                        data: [
                            { yAxis: detail.averageBuyPrice, name: 'Precio promedio de compra', lineStyle: { color: axisLabel, type: 'dashed' }, label: { formatter: `Promedio de compra: ${fmt(detail.averageBuyPrice)}`, color: axisLabel } },
                            ...splitLines.map(l => ({ ...l, lineStyle: { color: status.warning, type: 'dashed' as const } })),
                        ],
                    },
                },
                { name: 'Compras', type: 'scatter', data: buys, symbol: 'triangle', symbolSize: 12, itemStyle: { color: status.good } },
                { name: 'Ventas', type: 'scatter', data: sells, symbol: 'diamond', symbolSize: 12, itemStyle: { color: status.critical } },
            ],
        } as EChartsOption;
    }
}
