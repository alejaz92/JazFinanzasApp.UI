import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { EChartsOption } from 'echarts';

import { TripService } from '../../trips/services/trip.service';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { TripGeneralStats } from '../../trips/models/trip-stats.model';
import { TripStatus, TripType } from '../../trips/models/trip.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
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
    imports: [LoadingComponent, NgIf, NgFor, DatePipe, FormsModule, ChartComponent, CurrencyFiatFormatPipe],
    templateUrl: './trips-general-report.component.html',
    styleUrl: './trips-general-report.component.css'
})
export class TripsGeneralReportComponent implements OnInit {
    isLoading = true;
    trips: TripGeneralStats[] = [];
    mainReference: Asset | null = null;
    typeFilter: TripType | 'ALL' = 'ALL';

    totalByTripOptions: EChartsOption = {};

    constructor(
        private tripService: TripService,
        private assetService: AssetService,
        private chartThemeService: ChartThemeService
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
            this.buildChartOptions();
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
        this.buildChartOptions();
    }

    private buildChartOptions(): void {
        if (this.filteredTrips.length === 0) {
            this.totalByTripOptions = {};
            return;
        }

        const names = this.filteredTrips.map(t => t.name);
        const values = this.filteredTrips.map((t, i) => ({
            value: t.totalInReference,
            itemStyle: { color: this.chartThemeService.colorAt(i) }
        }));

        this.totalByTripOptions = {
            tooltip: {
                trigger: 'item',
                formatter: (params) => this.formatUsd(Number((params as { value: number }).value))
            },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'value' },
            yAxis: { type: 'category', data: names },
            series: [{ type: 'bar', data: values }]
        };
    }

    private formatUsd(value: number): string {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
}
