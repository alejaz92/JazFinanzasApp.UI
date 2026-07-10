import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
Chart.register(...registerables);
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { ReportService } from '../services/report.service';
import { CardService } from '../../card/services/card.service';
import { Card } from '../../card/models/card.model';
import { CardStats } from '../models/CardStats.model';
import { CardTransactionPaymentList } from '../../cardTransactions/models/CardTransactionPayment-List.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

@Component({
    selector: 'app-cards-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, DatePipe, CurrencyFiatFormatPipe],
    templateUrl: './cards-report.component.html',
    styleUrl: './cards-report.component.css'
})
export class CardsReportComponent implements OnInit {
    isLoading = true;
    isLoadingGraph = false;
    selectedCardDB3 = 0;
    cards: Card[] = [];
    cardTransactionsDTO: CardTransactionPaymentList[] = [];

    private db3Graph1: Chart | undefined;
    private db3Graph2: Chart | undefined;

    constructor(
        private reportService: ReportService,
        private cardService: CardService
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

        // Graph 1 — Pesos
        const ctx1 = document.getElementById('pesosCardsChart') as HTMLCanvasElement;
        if (ctx1) {
            this.db3Graph1?.destroy();
            const labelsG1 = cardStats.pesosCardGraphDTO.map(item => this.formatMonth(item.month));
            const dataG1 = cardStats.pesosCardGraphDTO.map(item => item.amount);
            const bgColors = dataG1.map((_, i) => i < currentMonthIndex ? 'rgba(255, 99, 132, 0.2)' : 'rgba(75, 192, 192, 0.2)');
            const borderColors = dataG1.map((_, i) => i < currentMonthIndex ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)');

            this.db3Graph1 = new Chart(ctx1, {
                type: 'bar',
                data: { labels: labelsG1, datasets: [{ label: 'Gastos en Pesos', data: dataG1, backgroundColor: bgColors, borderColor: borderColors, borderWidth: 1 }] },
                options: this.buildCardChartOptions('ARS', currentMonthIndex) as ChartConfiguration['options'],
                plugins: [ChartDataLabels]
            });
        }

        // Graph 2 — Dólares
        const ctx2 = document.getElementById('dollarCardsChart') as HTMLCanvasElement;
        if (ctx2) {
            this.db3Graph2?.destroy();
            const labelsG2 = cardStats.dollarsCardGraphDTO.map(item => this.formatMonth(item.month));
            const dataG2 = cardStats.dollarsCardGraphDTO.map(item => item.amount);
            const bgColors2 = dataG2.map((_, i) => i < currentMonthIndex ? 'rgba(255, 99, 132, 0.2)' : 'rgba(75, 192, 192, 0.2)');
            const borderColors2 = dataG2.map((_, i) => i < currentMonthIndex ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)');

            this.db3Graph2 = new Chart(ctx2, {
                type: 'bar',
                data: { labels: labelsG2, datasets: [{ label: 'Gastos en Dolares', data: dataG2, backgroundColor: bgColors2, borderColor: borderColors2, borderWidth: 1 }] },
                options: this.buildCardChartOptions('ARS', currentMonthIndex) as ChartConfiguration['options'],
                plugins: [ChartDataLabels]
            });
        }
    }

    private buildCardChartOptions(currency: string, splitIndex: number): object {
        return {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        generateLabels: () => [
                            { text: '6 Meses Anteriores', fillStyle: 'rgba(255, 99, 132, 0.2)', strokeStyle: 'rgba(255, 99, 132, 1)', lineWidth: 1 },
                            { text: '6 Meses Posteriores', fillStyle: 'rgba(75, 192, 192, 0.2)', strokeStyle: 'rgba(75, 192, 192, 1)', lineWidth: 1 }
                        ]
                    }
                },
                datalabels: {
                    display: true, color: '#000',
                    formatter: (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(value),
                    anchor: 'end', align: 'top', offset: 4
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(value) }
                }
            }
        };
    }

    private formatMonth(monthStr: Date | string): string {
        const date = new Date(monthStr);
        const label = date.toLocaleString('es-AR', { month: 'long' });
        return label.charAt(0).toUpperCase() + label.slice(1);
    }
}
