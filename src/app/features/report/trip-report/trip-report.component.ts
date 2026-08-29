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
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

@Component({
    selector: 'app-trip-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, DecimalPipe, FormsModule, ChartComponent, CurrencyFiatFormatPipe],
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
            this.buildBreakdownOptions();
        });
    }

    private buildBreakdownOptions(): void {
        if (!this.detail || this.detail.breakdown.length === 0) {
            this.breakdownOptions = {};
            return;
        }

        const data = this.detail.breakdown.map(b => ({ name: b.transactionClass, value: b.amount }));

        this.breakdownOptions = {
            tooltip: {
                trigger: 'item',
                formatter: (params) => {
                    const p = params as { name: string; value: number; percent: number };
                    return `${p.name}: ${this.formatUsd(p.value)} (${p.percent}%)`;
                }
            },
            series: [{
                type: 'pie',
                radius: ['45%', '70%'],
                data,
                label: {
                    show: true,
                    position: 'inside',
                    color: '#fff',
                    formatter: (params) => {
                        const p = params as { name: string; percent: number };
                        return p.percent > 5 ? p.name : '';
                    }
                }
            }]
        };
    }

    private formatUsd(value: number): string {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
}
