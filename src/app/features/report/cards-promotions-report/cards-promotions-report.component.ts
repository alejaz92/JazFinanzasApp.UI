import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe, DecimalPipe } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { CardReportService } from '../services/card-report.service';
import { CardPromotionsReport } from '../models/card-report.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

// Tarjetas — Promociones y reintegros (Fase 15): cuánto ahorran las promos y qué queda pendiente
// de acreditar o de aplicar (CardReportController.GetPromotionsAsync).
@Component({
    selector: 'app-cards-promotions-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, DatePipe, DecimalPipe, CurrencyFiatFormatPipe, ChartComponent],
    templateUrl: './cards-promotions-report.component.html',
    styleUrl: './cards-promotions-report.component.css'
})
export class CardsPromotionsReportComponent implements OnInit {
    private readonly cardReportService = inject(CardReportService);
    private readonly chartTheme = inject(ChartThemeService);

    isLoading = true;
    data: CardPromotionsReport | null = null;

    monthlyOptions: EChartsOption = {};

    ngOnInit(): void {
        this.cardReportService.getPromotions().subscribe(data => {
            this.data = data;
            this.isLoading = false;
            setTimeout(() => this.renderChart(), 0);
        });
    }

    get hasMonthlyData(): boolean {
        return (this.data?.monthlySeries.some(m => m.pesosAmount > 0 || m.dollarsAmount > 0) ?? false);
    }

    private renderChart(): void {
        if (!this.data) return;
        const months = this.data.monthlySeries;
        const labels = months.map(m => new Date(m.month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        this.monthlyOptions = {
            color: [this.chartTheme.colorAt(0), this.chartTheme.colorAt(1)],
            legend: { top: 0, textStyle: { color: axisLabel } },
            grid: { left: 70, right: 20, top: 40, bottom: 40 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'category', data: labels, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series: [
                { name: 'Pesos', type: 'bar', data: months.map(m => m.pesosAmount), itemStyle: { color: this.chartTheme.colorAt(0) } },
                { name: 'Dólares', type: 'bar', data: months.map(m => m.dollarsAmount), itemStyle: { color: this.chartTheme.colorAt(1) } },
            ],
        } as EChartsOption;
    }
}
