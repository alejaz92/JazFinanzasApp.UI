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
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, DatePipe, ChartComponent, CurrencyFiatFormatPipe],
    templateUrl: './cards-report.component.html',
    styleUrl: './cards-report.component.css'
})
export class CardsReportComponent implements OnInit {
    isLoading = true;
    isLoadingGraph = false;
    selectedCardDB3 = 0;
    cards: Card[] = [];
    cardTransactionsDTO: CardTransactionPaymentList[] = [];

    pesosCardOptions: EChartsOption = {};
    dollarCardOptions: EChartsOption = {};

    constructor(
        private reportService: ReportService,
        private cardService: CardService,
        private chartThemeService: ChartThemeService
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
                this.buildChartOptions(response);
                this.cardTransactionsDTO = response.cardTransactionsDTO;
            });
    }

    private buildChartOptions(cardStats: CardStats): void {
        const currentMonthIndex = 6;
        this.pesosCardOptions = this.buildCardChartOptions(cardStats.pesosCardGraphDTO, 'ARS', currentMonthIndex);
        this.dollarCardOptions = this.buildCardChartOptions(cardStats.dollarsCardGraphDTO, 'ARS', currentMonthIndex);
    }

    // Cada columna se arma con dos series superpuestas (barGap: '-100%'): cada una
    // solo tiene valor en la mitad que le corresponde (antes/después del mes actual),
    // así el color por columna sale del nombre de serie y el legend queda automático
    // en vez del legend manual que armaba Chart.js con generateLabels().
    private buildCardChartOptions(items: { month: Date | string; amount: number }[], currency: string, splitIndex: number): EChartsOption {
        const labels = items.map(item => this.formatMonth(item.month));
        const values = items.map(item => item.amount);
        const format = (value: number) => this.formatCurrency(value, currency);
        const semantic = this.chartThemeService.semantic;

        const previous = values.map((v, i) => (i < splitIndex ? v : null));
        const next = values.map((v, i) => (i >= splitIndex ? v : null));

        const labelConfig = {
            show: true,
            position: 'top' as const,
            formatter: (params: unknown) => {
                const value = (params as { value: number | null }).value;
                return value != null ? format(value) : '';
            }
        };

        return {
            tooltip: { trigger: 'item', valueFormatter: (value) => format(Number(value)) },
            legend: {},
            grid: { left: '3%', right: '4%', top: '15%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: labels },
            yAxis: { type: 'value', axisLabel: { formatter: (value: number) => format(value) } },
            series: [
                { name: '6 Meses Anteriores', type: 'bar', data: previous, itemStyle: { color: semantic.expense }, label: labelConfig, barGap: '-100%' },
                { name: '6 Meses Posteriores', type: 'bar', data: next, itemStyle: { color: semantic.income }, label: labelConfig }
            ]
        };
    }

    private formatMonth(monthStr: Date | string): string {
        const date = new Date(monthStr);
        const label = date.toLocaleString('es-AR', { month: 'long' });
        return label.charAt(0).toUpperCase() + label.slice(1);
    }

    private formatCurrency(value: number, currency: string): string {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(value);
    }
}
