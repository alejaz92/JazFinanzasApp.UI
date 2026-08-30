import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { EChartsOption } from 'echarts';

import { ReportService } from '../services/report.service';
import { CardService } from '../../card/services/card.service';
import { Card } from '../../card/models/card.model';
import { CardStats } from '../models/CardStats.model';
import { CardTransactionPaymentList } from '../../cardTransactions/models/CardTransactionPayment-List.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

@Component({
    selector: 'app-cards-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, DatePipe, CurrencyFiatFormatPipe, ChartComponent],
    templateUrl: './cards-report.component.html',
    styleUrl: './cards-report.component.css'
})
export class CardsReportComponent implements OnInit {
    isLoading = true;
    isLoadingGraph = false;
    selectedCardDB3 = 0;
    cards: Card[] = [];
    cardTransactionsDTO: CardTransactionPaymentList[] = [];
    pesosChartOptions: EChartsOption = {};
    dollarChartOptions: EChartsOption = {};

    constructor(
        private reportService: ReportService,
        private cardService: CardService,
        private chartTheme: ChartThemeService
    ) {}

    ngOnInit(): void {
        this.loadCards();
        this.loadCardStats();
    }

    loadCards(): void {
        this.cardService.getAllCards().subscribe(response => {
            this.cards = response;
            this.isLoading = false;
        });
    }

    loadCardStats(): void {
        this.cardTransactionsDTO = [];
        this.isLoadingGraph = true;

        this.reportService.getCardStats(this.selectedCardDB3)
            .subscribe(response => {
                this.isLoadingGraph = false;
                setTimeout(() => {
                    this.renderCharts(response);
                    this.cardTransactionsDTO = response.cardTransactionsDTO;
                }, 0);
            });
    }

    private renderCharts(cardStats: CardStats): void {
        const currentMonthIndex = 6;

        const labelsG1 = cardStats.pesosCardGraphDTO.map(item => this.formatMonth(item.month));
        const dataG1 = cardStats.pesosCardGraphDTO.map(item => item.amount);
        this.pesosChartOptions = this.buildCardChartOptions(labelsG1, dataG1, 'ARS', currentMonthIndex);

        const labelsG2 = cardStats.dollarsCardGraphDTO.map(item => this.formatMonth(item.month));
        const dataG2 = cardStats.dollarsCardGraphDTO.map(item => item.amount);
        this.dollarChartOptions = this.buildCardChartOptions(labelsG2, dataG2, 'ARS', currentMonthIndex);
    }

    /** Divide la serie en "ya pasado" / "proyectado" para que cada mitad tenga su propio color y entrada de leyenda real. */
    private buildCardChartOptions(labels: string[], values: number[], currency: string, splitIndex: number): EChartsOption {
        const fmt = (v: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(v);
        const axisLabel = this.chartTheme.surface.axisLabel;
        const past = values.map((v, i) => (i < splitIndex ? v : null));
        const future = values.map((v, i) => (i < splitIndex ? null : v));

        return {
            color: [this.chartTheme.colorAt(0), this.chartTheme.colorAt(1)],
            legend: { data: ['6 meses anteriores', '6 meses posteriores'], textStyle: { color: axisLabel } },
            grid: { left: 70, right: 20, top: 40, bottom: 40 },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                ...this.chartTheme.tooltipDefaults(),
                valueFormatter: (v: unknown) => fmt(Number(v)),
            },
            xAxis: {
                type: 'category',
                data: labels,
                axisLabel: { color: axisLabel },
                axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } },
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) },
                splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } },
            },
            series: [
                { name: '6 meses anteriores', type: 'bar', data: past, label: { show: true, position: 'top', color: axisLabel, formatter: (p: any) => fmt(p.value) } },
                { name: '6 meses posteriores', type: 'bar', data: future, label: { show: true, position: 'top', color: axisLabel, formatter: (p: any) => fmt(p.value) } },
            ],
        };
    }

    private formatMonth(monthStr: Date | string): string {
        const date = new Date(monthStr);
        const label = date.toLocaleString('es-AR', { month: 'long' });
        return label.charAt(0).toUpperCase() + label.slice(1);
    }
}
