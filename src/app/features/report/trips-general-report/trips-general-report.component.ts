import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

import { TripService } from '../../trips/services/trip.service';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { TripGeneralStats } from '../../trips/models/trip-stats.model';
import { TripStatus, TripType } from '../../trips/models/trip.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

const STATUS_LABELS: Record<TripStatus, string> = {
    PLANNED: 'Planificado',
    IN_PROGRESS: 'En curso',
    FINISHED: 'Finalizado'
};

const TYPE_LABELS: Record<TripType, string> = {
    DOMESTIC: 'Doméstico',
    INTERNATIONAL: 'Internacional'
};

@Component({
    selector: 'app-trips-general-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, DatePipe, FormsModule, CurrencyFiatFormatPipe],
    templateUrl: './trips-general-report.component.html',
    styleUrl: './trips-general-report.component.css'
})
export class TripsGeneralReportComponent implements OnInit {
    isLoading = true;
    trips: TripGeneralStats[] = [];
    mainReference: Asset | null = null;
    typeFilter: TripType | 'ALL' = 'ALL';

    private totalByTripChart: Chart | undefined;

    constructor(
        private tripService: TripService,
        private assetService: AssetService
    ) {}

    ngOnInit(): void {
        this.loadMainReference();
        this.loadTrips();
    }

    loadMainReference(): void {
        this.assetService.getReferenceAssets().subscribe((data: Asset[]) => {
            this.mainReference = data.find(x => x.isMainReference) ?? null;
        });
    }

    loadTrips(): void {
        this.tripService.getTripsGeneralStats().subscribe(response => {
            this.trips = response;
            this.isLoading = false;
            setTimeout(() => this.renderChart(), 0);
        });
    }

    get filteredTrips(): TripGeneralStats[] {
        if (this.typeFilter === 'ALL') return this.trips;
        return this.trips.filter(t => t.type === this.typeFilter);
    }

    get totalInReference(): number {
        return this.filteredTrips.reduce((sum, t) => sum + t.totalInReference, 0);
    }

    statusLabel(status: TripStatus): string {
        return STATUS_LABELS[status];
    }

    typeLabel(type: TripType): string {
        return TYPE_LABELS[type];
    }

    onFilterChange(): void {
        setTimeout(() => this.renderChart(), 0);
    }

    private renderChart(): void {
        const ctx = document.getElementById('totalByTripChart') as HTMLCanvasElement;
        if (!ctx) return;
        this.totalByTripChart?.destroy();
        if (this.filteredTrips.length === 0) return;

        const names = this.filteredTrips.map(t => t.name);
        const values = this.filteredTrips.map(t => t.totalInReference);
        const colors = this.generateControlledColors(values.length);

        this.totalByTripChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: names, datasets: [{ label: 'Total', data: values, backgroundColor: colors }] },
            options: {
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (tooltipItem) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(tooltipItem.raw))
                        }
                    }
                },
                scales: { x: { beginAtZero: true } }
            }
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
