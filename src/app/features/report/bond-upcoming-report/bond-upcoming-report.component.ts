import { Component, inject, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { InvestmentReportService } from '../services/investment-report.service';
import { BondUpcomingReport } from '../models/investment-report.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { InfoButtonComponent } from '../../../shared/components/info-button/info-button.component';
import { CurrencySummary, monthLabel, monthlyChartData, summarizeByCurrency } from './bond-upcoming.util';

interface CurrencyChart {
    currency: string;
    options: EChartsOption;
}

// Próximos cobros de bonos (plan-amortizaciones-bonos, Fase 15): lo que vas a cobrar de tus bonos de
// acá al vencimiento, estimado con la tenencia de hoy. A diferencia del resto de Inversiones no usa la
// moneda de referencia de la barra: los montos van en la moneda en la que paga cada bono (el backend
// no los convierte), así que la pantalla se carga una vez y no se vuelve a pedir al cambiar la moneda.
@Component({
    selector: 'app-bond-upcoming-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, DatePipe, DecimalPipe, ChartComponent, CurrencyFiatFormatPipe, InfoButtonComponent],
    templateUrl: './bond-upcoming-report.component.html',
    styleUrl: './bond-upcoming-report.component.css'
})
export class BondUpcomingReportComponent implements OnInit {
    private readonly investmentReportService = inject(InvestmentReportService);
    private readonly chartTheme = inject(ChartThemeService);

    isLoading = true;
    report: BondUpcomingReport | null = null;
    summaries: CurrencySummary[] = [];
    charts: CurrencyChart[] = [];

    protected readonly monthLabel = monthLabel;

    ngOnInit(): void {
        this.investmentReportService.getBondUpcoming().subscribe({
            next: report => {
                this.report = report;
                this.summaries = summarizeByCurrency(report);
                this.isLoading = false;
                setTimeout(() => this.renderCharts(report), 0);
            },
            error: () => { this.isLoading = false; }
        });
    }

    get hasPayments(): boolean {
        return !!this.report && this.report.payments.length > 0;
    }

    private renderCharts(report: BondUpcomingReport): void {
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 2 });

        this.charts = this.summaries.map(s => {
            const data = monthlyChartData(report.months, s.currency);
            return {
                currency: s.currency,
                options: {
                    color: [this.chartTheme.colorAt(2), this.chartTheme.colorAt(4)],
                    grid: { left: 70, right: 20, top: 40, bottom: 50 },
                    legend: { data: ['Capital', 'Interés'], textStyle: { color: axisLabel } },
                    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
                    xAxis: { type: 'category', data: data.labels, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
                    yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
                    series: [
                        { name: 'Capital', type: 'bar', stack: 'cobro', data: data.capital },
                        { name: 'Interés', type: 'bar', stack: 'cobro', data: data.interest },
                    ],
                } as EChartsOption,
            };
        });
    }
}
