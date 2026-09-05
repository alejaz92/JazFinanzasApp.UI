import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { CardReportService } from '../services/card-report.service';
import { CardMonthlySeriesPoint } from '../models/card-report.model';
import { CardTransactionPaymentList } from '../../cardTransactions/models/CardTransactionPayment-List.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

// Tarjetas — General (Fase 15): reemplaza a la vieja pantalla "Tarjetas" (features/report/cards-report,
// dada de baja). Consumo devengado (CardTransaction.Date/TotalAmount), apilado por mes y por tarjeta,
// pesos y dólares siempre por separado — mismo criterio que ya traía CardReportService (Fase 14).
@Component({
    selector: 'app-cards-general-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, DatePipe, CurrencyFiatFormatPipe, ChartComponent],
    templateUrl: './cards-general-report.component.html',
    styleUrl: './cards-general-report.component.css'
})
export class CardsGeneralReportComponent implements OnInit {
    private readonly cardReportService = inject(CardReportService);
    private readonly chartTheme = inject(ChartThemeService);

    isLoading = true;
    isLoadingSummary = false;
    monthlySeries: CardMonthlySeriesPoint[] = [];
    summaryMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    monthSummary: CardTransactionPaymentList[] = [];

    pesosChartOptions: EChartsOption = {};
    dollarsChartOptions: EChartsOption = {};

    ngOnInit(): void {
        this.cardReportService.getGeneral().subscribe(data => {
            this.monthlySeries = data.monthlySeries;
            this.monthSummary = data.currentMonthSummary;
            this.isLoading = false;
            setTimeout(() => this.renderCharts(), 0);
        });
    }

    previousMonth(): void {
        this.summaryMonth = new Date(this.summaryMonth.getFullYear(), this.summaryMonth.getMonth() - 1, 1);
        this.loadSummary();
    }

    nextMonth(): void {
        this.summaryMonth = new Date(this.summaryMonth.getFullYear(), this.summaryMonth.getMonth() + 1, 1);
        this.loadSummary();
    }

    get summaryMonthLabel(): string {
        return this.summaryMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    }

    private loadSummary(): void {
        this.isLoadingSummary = true;
        const year = this.summaryMonth.getFullYear();
        const month = (this.summaryMonth.getMonth() + 1).toString().padStart(2, '0');
        this.cardReportService.getMonthSummary(`${year}-${month}-01`).subscribe(data => {
            this.monthSummary = data;
            this.isLoadingSummary = false;
        });
    }

    private renderCharts(): void {
        if (this.monthlySeries.length === 0) return;
        const cards = this.monthlySeries[0].cards;
        const labels = this.monthlySeries.map(m => new Date(m.month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));

        this.pesosChartOptions = this.buildStackedBar(cards.map(c => c.cardId), cards.map(c => c.cardName), labels, cardId =>
            this.monthlySeries.map(m => m.cards.find(c => c.cardId === cardId)?.pesosAmount ?? 0));

        this.dollarsChartOptions = this.buildStackedBar(cards.map(c => c.cardId), cards.map(c => c.cardName), labels, cardId =>
            this.monthlySeries.map(m => m.cards.find(c => c.cardId === cardId)?.dollarsAmount ?? 0));
    }

    private buildStackedBar(cardIds: number[], cardNames: string[], labels: string[], valuesFor: (cardId: number) => number[]): EChartsOption {
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        return {
            color: cardIds.map((_, i) => this.chartTheme.colorAt(i)),
            legend: { top: 0, textStyle: { color: axisLabel } },
            grid: { left: 70, right: 20, top: 40, bottom: 40 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'category', data: labels, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series: cardIds.map((cardId, i) => ({
                name: cardNames[i],
                type: 'bar',
                stack: 'total',
                data: valuesFor(cardId),
                itemStyle: { color: this.chartTheme.colorAt(i) },
            })),
        } as EChartsOption;
    }

    get hasCards(): boolean {
        return this.monthlySeries.length > 0 && this.monthlySeries[0].cards.length > 0;
    }
}
