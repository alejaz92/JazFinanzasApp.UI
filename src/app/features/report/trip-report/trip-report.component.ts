import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { EChartsOption } from 'echarts';

import { TripService } from '../../trips/services/trip.service';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { Trip } from '../../trips/models/trip.model';
import { TripDetailStats } from '../../trips/models/trip-stats.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

@Component({
    selector: 'app-trip-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, DecimalPipe, FormsModule, CurrencyFiatFormatPipe, ChartComponent],
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
    breakdownOptions: EChartsOption = {};

    constructor(
        private tripService: TripService,
        private assetService: AssetService,
        private chartTheme: ChartThemeService
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
        if (!this.detail || this.detail.breakdown.length === 0) {
            this.breakdownOptions = {};
            return;
        }
        const classes = this.detail.breakdown.map(b => b.transactionClass);
        const values = this.detail.breakdown.map(b => b.amount);
        this.breakdownOptions = this.chartTheme.pieOptions(classes, values);
    }
}
