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
    imports: [LoadingComponent, NgIf, NgFor, DatePipe, FormsModule, CurrencyFiatFormatPipe, ChartComponent],
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
        private chartTheme: ChartThemeService
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
        if (this.filteredTrips.length === 0) {
            this.totalByTripOptions = {};
            return;
        }

        const names = this.filteredTrips.map(t => t.name);
        const values = this.filteredTrips.map(t => t.totalInReference);
        const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
        const axisLabel = this.chartTheme.surface.axisLabel;

        this.totalByTripOptions = {
            grid: { left: 100, right: 30, top: 20, bottom: 30 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            yAxis: { type: 'category', data: names, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            series: [{
                type: 'bar',
                data: values,
                itemStyle: { color: (p: any) => this.chartTheme.colorAt(p.dataIndex) },
            }],
        };
    }
}
