import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { EChartsOption } from 'echarts';

import { ReportService } from '../services/report.service';
import { IncExpStats } from '../models/IncExpStats.model';
import { AssetService } from '../../asset/services/asset.service';
import { Asset } from '../../asset/models/asset.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';

@Component({
    selector: 'app-inc-exp-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, ChartComponent],
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

    incomeByClassOptions: EChartsOption = {};
    expenseByClassOptions: EChartsOption = {};
    incomeLast6MonthsOptions: EChartsOption = {};
    expenseLast6MonthsOptions: EChartsOption = {};

    constructor(
        private reportService: ReportService,
        private assetService: AssetService,
        private chartThemeService: ChartThemeService
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
                    this.buildChartOptions();
                    this.viewAux = true;
                });
        }
    }

    private buildChartOptions(): void {
        const currency = this.selectedAssetDB1?.symbol ?? '';
        const semantic = this.chartThemeService.semantic;

        this.incomeByClassOptions = this.buildBarOptions(this.filterByClass(this.incExpStats?.classIncomeStats ?? []), currency, semantic.income);
        this.expenseByClassOptions = this.buildBarOptions(this.filterByClass(this.incExpStats?.classExpenseStats ?? []), currency, semantic.expense);
        this.incomeLast6MonthsOptions = this.buildBarOptions(
            (this.incExpStats?.monthIncomeStats ?? []).map(i => ({ transactionClass: this.formatMonth(i.month), amount: i.amount })),
            currency, semantic.income
        );
        this.expenseLast6MonthsOptions = this.buildBarOptions(
            (this.incExpStats?.monthExpenseStats ?? []).map(i => ({ transactionClass: this.formatMonth(i.month), amount: i.amount })),
            currency, semantic.expense
        );
    }

    // Agrupa en "Otros" las clases que no llegan al 5% del total — mismo criterio que antes.
    private filterByClass(rawData: { transactionClass: string; amount: number }[]): { transactionClass: string; amount: number }[] {
        const total = rawData.reduce((sum, item) => sum + item.amount, 0);
        const threshold = total * 0.05;

        const filtered = rawData.filter(item => item.amount >= threshold);
        const otherTotal = rawData.filter(item => item.amount < threshold).reduce((sum, item) => sum + item.amount, 0);
        if (otherTotal > 0) filtered.push({ transactionClass: 'Otros', amount: otherTotal });
        return filtered;
    }

    private buildBarOptions(data: { transactionClass: string; amount: number }[], currency: string, color: string): EChartsOption {
        const format = (value: number) => this.formatCurrency(value, currency);

        return {
            grid: { left: '3%', right: '4%', top: '15%', bottom: '3%', containLabel: true },
            tooltip: { trigger: 'axis', valueFormatter: (value) => format(Number(value)) },
            xAxis: { type: 'category', data: data.map(i => i.transactionClass) },
            yAxis: { type: 'value', axisLabel: { formatter: (value: number) => format(value) } },
            series: [{
                type: 'bar',
                data: data.map(i => i.amount),
                itemStyle: { color },
                label: { show: true, position: 'top', formatter: (params) => format(Number((params as { value: number }).value)) }
            }]
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
