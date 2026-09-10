import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { InvestmentReportService } from '../services/investment-report.service';
import { CryptoDetailReport } from '../models/investment-report.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CurrencyInvestmentFormatPipe } from '../../../shared/pipes/currencyInvestmentFormat/currency-investment-format.pipe';
import { MovementTypePipe } from '../../../shared/pipes/movementType/movement-type.pipe';
import { CommerceTypePipe } from '../../../shared/pipes/commerceType/commerce-type.pipe';

// Cryptos — Detalle (Fase 20, Flujo 5; selector de crypto movido a la barra de filtros compartida
// el 2026-09-10, mismo criterio que "Por tarjeta" — antes vivía suelto en el cuerpo de esta
// pantalla, fuera de la barra): reemplaza el gauge de la pantalla vieja por la línea de cotización
// con las compras/ventas marcadas encima y el precio promedio de compra como línea horizontal — "se
// ve de una si compré caro o barato" (Flujo 5, sección 6).
@Component({
    selector: 'app-crypto-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, DatePipe, ChartComponent, CurrencyFiatFormatPipe, CurrencyInvestmentFormatPipe, MovementTypePipe, CommerceTypePipe],
    templateUrl: './crypto-report.component.html',
    styleUrl: './crypto-report.component.css'
})
export class CryptoReportComponent {
    private readonly investmentReportService = inject(InvestmentReportService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoadingDetail = true;
    detail: CryptoDetailReport | null = null;

    priceOptions: EChartsOption = {};

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            const cryptoAssetId = this.reportContext.selectedCryptoAssetId();
            if (assetId == null || cryptoAssetId == null) return;
            this.loadDetail(cryptoAssetId, assetId);
        });
    }

    private loadDetail(cryptoAssetId: number, assetId: number): void {
        this.isLoadingDetail = true;
        this.investmentReportService.getCryptoDetail(cryptoAssetId, assetId).subscribe(detail => {
            this.isLoadingDetail = false;
            this.detail = detail;
            setTimeout(() => this.renderPriceChart(detail), 0);
        });
    }

    private renderPriceChart(detail: CryptoDetailReport): void {
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 2 });
        const status = this.chartTheme.status;

        const priceData = detail.priceEvolution.map(p => [new Date(p.month).getTime(), p.value]);
        const buys = detail.transactions.filter(t => t.movementType === 'I').map(t => [new Date(t.date).getTime(), t.quotePrice]);
        const sells = detail.transactions.filter(t => t.movementType === 'E').map(t => [new Date(t.date).getTime(), t.quotePrice]);

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
                        data: [{ yAxis: detail.averageBuyPrice, name: 'Precio promedio de compra' }],
                        lineStyle: { color: axisLabel, type: 'dashed' },
                        label: { formatter: `Promedio de compra: ${fmt(detail.averageBuyPrice)}`, color: axisLabel },
                    },
                },
                { name: 'Compras', type: 'scatter', data: buys, symbol: 'triangle', symbolSize: 12, itemStyle: { color: status.good } },
                { name: 'Ventas', type: 'scatter', data: sells, symbol: 'diamond', symbolSize: 12, itemStyle: { color: status.critical } },
            ],
        } as EChartsOption;
    }
}
