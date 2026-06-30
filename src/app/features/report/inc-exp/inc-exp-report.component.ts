import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
Chart.register(...registerables);
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { ReportService } from '../services/report.service';
import { IncExpStats } from '../models/IncExpStats.model';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';

@Component({
    selector: 'app-inc-exp-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule],
    templateUrl: './inc-exp-report.component.html'
})
export class IncExpReportComponent implements OnInit {
    isLoading = true;
    assetsDB1: Asset[] = [];
    selectedAssetIdDB1 = 0;
    selectedAssetDB1: Asset | null = null;
    selectedMonthDB1 = '';
    incExpStats: IncExpStats | null = null;
    viewAux = false;
    isLoadingGraph = false;

    private db1Graph1: Chart | undefined;
    private db1Graph2: Chart | undefined;
    private db1Graph3: Chart | undefined;
    private db1Graph4: Chart | undefined;

    constructor(
        private reportService: ReportService,
        private assetService: AssetService
    ) {}

    ngOnInit(): void {
        this.viewAux = false;
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        this.selectedMonthDB1 = `${year}-${month}`;
        this.loadAssetsDB1();
    }

    loadAssetsDB1(): void {
        this.assetService.getReferenceAssets().subscribe((data: Asset[]) => {
            this.assetsDB1 = data;
            this.isLoading = false;
        });
    }

    loadIncExpStats(): void {
        this.selectedAssetDB1 = this.assetsDB1.find(x => x.id == this.selectedAssetIdDB1) ?? null;

        if (this.selectedAssetDB1 == null) {
            this.viewAux = false;
            return;
        }

        if (this.selectedMonthDB1 != null && this.selectedAssetIdDB1 != 0) {
            this.isLoadingGraph = true;
            this.viewAux = false;

            this.reportService.getIncExpStats(this.selectedMonthDB1, this.selectedAssetDB1.id)
                .subscribe(response => {
                    this.incExpStats = response;
                    this.isLoadingGraph = false;
                    this.viewAux = true;
                    setTimeout(() => this.renderCharts(), 0);
                });
        }
    }

    private renderCharts(): void {
        this.renderIncomeByClass();
        this.renderExpenseByClass();
        this.renderIncomeLast6Months();
        this.renderExpenseLast6Months();
        this.viewAux = true;
    }

    private renderIncomeByClass(): void {
        const rawData = this.incExpStats?.classIncomeStats || [];
        const total = rawData.reduce((sum, item) => sum + item.amount, 0);
        const threshold = total * 0.05;

        let filtered = rawData.filter(item => item.amount >= threshold);
        const otherTotal = rawData.filter(item => item.amount < threshold).reduce((sum, item) => sum + item.amount, 0);
        if (otherTotal > 0) filtered.push({ transactionClass: 'Otros', amount: otherTotal });

        const ctx = document.getElementById('incomeByClassChart') as HTMLCanvasElement;
        if (!ctx) return;
        this.db1Graph1?.destroy();
        this.db1Graph1 = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: filtered.map(i => i.transactionClass),
                datasets: [{ label: 'Ingresos en ' + this.selectedAssetDB1?.symbol, data: filtered.map(i => i.amount), backgroundColor: 'rgba(75, 192, 192, 0.2)', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1 }]
            },
            options: this.buildBarOptions(this.selectedAssetDB1?.symbol ?? '') as ChartConfiguration['options'],
            plugins: [ChartDataLabels]
        });
    }

    private renderExpenseByClass(): void {
        const rawData = this.incExpStats?.classExpenseStats || [];
        const total = rawData.reduce((sum, item) => sum + item.amount, 0);
        const threshold = total * 0.05;

        let filtered = rawData.filter(item => item.amount >= threshold);
        const otherTotal = rawData.filter(item => item.amount < threshold).reduce((sum, item) => sum + item.amount, 0);
        if (otherTotal > 0) filtered.push({ transactionClass: 'Otros', amount: otherTotal });

        const ctx = document.getElementById('expenseByClassChart') as HTMLCanvasElement;
        if (!ctx) return;
        this.db1Graph2?.destroy();
        this.db1Graph2 = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: filtered.map(i => i.transactionClass),
                datasets: [{ label: 'Egresos en ' + this.selectedAssetDB1?.symbol, data: filtered.map(i => i.amount), backgroundColor: 'rgba(255, 99, 132, 0.2)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 1 }]
            },
            options: this.buildBarOptions(this.selectedAssetDB1?.symbol ?? '') as ChartConfiguration['options'],
            plugins: [ChartDataLabels]
        });
    }

    private renderIncomeLast6Months(): void {
        const ctx = document.getElementById('incomeLast6MonthsChart') as HTMLCanvasElement;
        if (!ctx) return;
        this.db1Graph3?.destroy();
        this.db1Graph3 = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.incExpStats?.monthIncomeStats.map(item => this.formatMonth(item.month)) ?? [],
                datasets: [{ label: 'Ingresos en ' + this.selectedAssetDB1?.symbol, data: this.incExpStats?.monthIncomeStats.map(i => i.amount) ?? [], backgroundColor: 'rgba(75, 192, 192, 0.2)', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1 }]
            },
            options: this.buildBarOptions(this.selectedAssetDB1?.symbol ?? '') as ChartConfiguration['options'],
            plugins: [ChartDataLabels]
        });
    }

    private renderExpenseLast6Months(): void {
        const ctx = document.getElementById('expenseLast6MonthsChart') as HTMLCanvasElement;
        if (!ctx) return;
        this.db1Graph4?.destroy();
        this.db1Graph4 = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.incExpStats?.monthExpenseStats.map(item => this.formatMonth(item.month)) ?? [],
                datasets: [{ label: 'Egresos en ' + this.selectedAssetDB1?.symbol, data: this.incExpStats?.monthExpenseStats.map(i => i.amount) ?? [], backgroundColor: 'rgba(255, 99, 132, 0.2)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 1 }]
            },
            options: this.buildBarOptions(this.selectedAssetDB1?.symbol ?? '') as ChartConfiguration['options'],
            plugins: [ChartDataLabels]
        });
    }

    private formatMonth(monthStr: Date | string): string {
        const date = new Date(monthStr);
        const label = date.toLocaleString('es-AR', { month: 'long' });
        return label.charAt(0).toUpperCase() + label.slice(1);
    }

    private buildBarOptions(currency: string): object {
        return {
            responsive: true,
            plugins: {
                legend: { display: false },
                datalabels: {
                    color: '#000',
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
}
