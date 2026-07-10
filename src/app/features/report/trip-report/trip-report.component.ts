import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
Chart.register(...registerables);
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { TripService } from '../../trips/services/trip.service';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { Trip } from '../../trips/models/trip.model';
import { TripDetailStats } from '../../trips/models/trip-stats.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

@Component({
    selector: 'app-trip-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, DecimalPipe, FormsModule, CurrencyFiatFormatPipe],
    templateUrl: './trip-report.component.html',
    styleUrl: './trip-report.component.css'
})
export class TripReportComponent implements OnInit {
    isLoading = true;
    isLoadingDetail = false;
    viewDetail = false;
    selectedTripId = 0;
    trips: Trip[] = [];
    detail: TripDetailStats | null = null;
    mainReference: Asset | null = null;

    private breakdownChart: Chart | undefined;

    constructor(
        private tripService: TripService,
        private assetService: AssetService
    ) {}

    ngOnInit(): void {
        this.loadTrips();
        this.loadMainReference();
    }

    loadTrips(): void {
        this.tripService.getAllTrips().subscribe(response => {
            this.trips = response;
            this.isLoading = false;
        });
    }

    loadMainReference(): void {
        this.assetService.getReferenceAssets().subscribe((data: Asset[]) => {
            this.mainReference = data.find(x => x.isMainReference) ?? null;
        });
    }

    loadTripDetail(): void {
        if (this.selectedTripId == 0) {
            this.viewDetail = false;
            return;
        }
        this.detail = null;
        this.viewDetail = false;
        this.isLoadingDetail = true;

        this.tripService.getTripDetailStats(this.selectedTripId).subscribe(detail => {
            this.isLoadingDetail = false;
            this.viewDetail = true;
            this.detail = detail;
            setTimeout(() => this.renderBreakdownChart(), 0);
        });
    }

    private renderBreakdownChart(): void {
        const ctx = document.getElementById('tripBreakdownChart') as HTMLCanvasElement;
        if (!ctx || !this.detail) return;
        this.breakdownChart?.destroy();
        if (this.detail.breakdown.length === 0) return;

        const classes = this.detail.breakdown.map(b => b.transactionClass);
        const values = this.detail.breakdown.map(b => b.amount);
        const colors = this.generateControlledColors(values.length);

        this.breakdownChart = new Chart(ctx, {
            type: 'pie',
            data: { labels: classes, datasets: [{ data: values, backgroundColor: colors, hoverOffset: 4 }] },
            options: {
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (tooltipItem) => {
                                const total = values.reduce((a, b) => a + b, 0);
                                const pct = total ? ((Number(tooltipItem.raw) / total) * 100).toFixed(2) : '0.00';
                                return `${classes[tooltipItem.dataIndex]}: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(tooltipItem.raw))} (${pct}%)`;
                            }
                        }
                    },
                    datalabels: {
                        display: true, color: 'white', align: 'center', anchor: 'center', font: { weight: 'bold' },
                        formatter: (value, context) => {
                            const total = (context.chart.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
                            const pct = total ? ((value / total) * 100).toFixed(2) : '0.00';
                            return Number(pct) > 5 && context.chart.data.labels ? context.chart.data.labels[context.dataIndex] : '';
                        }
                    }
                }
            } as ChartConfiguration['options'],
            plugins: [ChartDataLabels]
        });
    }

    private generateControlledColors(quantity: number): string[] {
        const colors = [];
        const step = 360 / quantity;
        for (let i = 0; i < quantity; i++) {
            const hue = Math.floor(i * step);
            const saturation = Math.floor(Math.random() * 30 + 70);
            const lightness = Math.floor(Math.random() * 20 + 40);
            colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        }
        return colors;
    }
}
