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
        private chartTheme: ChartThemeService
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

        this.incomeByClassOptions = this.buildSingleBarOptions(
            filtered.map(i => i.transactionClass),
            filtered.map(i => i.amount),
            this.selectedAssetDB1?.symbol ?? '',
            this.chartTheme.colorAt(2)
        );
    }

    private renderExpenseByClass(): void {
        const rawData = this.incExpStats?.classExpenseStats || [];
        const total = rawData.reduce((sum, item) => sum + item.amount, 0);
        const threshold = total * 0.05;

        let filtered = rawData.filter(item => item.amount >= threshold);
        const otherTotal = rawData.filter(item => item.amount < threshold).reduce((sum, item) => sum + item.amount, 0);
        if (otherTotal > 0) filtered.push({ transactionClass: 'Otros', amount: otherTotal });

        this.expenseByClassOptions = this.buildSingleBarOptions(
            filtered.map(i => i.transactionClass),
            filtered.map(i => i.amount),
            this.selectedAssetDB1?.symbol ?? '',
            this.chartTheme.colorAt(7)
        );
    }

    private renderIncomeLast6Months(): void {
        this.incomeLast6MonthsOptions = this.buildSingleBarOptions(
            this.incExpStats?.monthIncomeStats.map(item => this.formatMonth(item.month)) ?? [],
            this.incExpStats?.monthIncomeStats.map(i => i.amount) ?? [],
            this.selectedAssetDB1?.symbol ?? '',
            this.chartTheme.colorAt(2)
        );
    }

    private renderExpenseLast6Months(): void {
        this.expenseLast6MonthsOptions = this.buildSingleBarOptions(
            this.incExpStats?.monthExpenseStats.map(item => this.formatMonth(item.month)) ?? [],
            this.incExpStats?.monthExpenseStats.map(i => i.amount) ?? [],
            this.selectedAssetDB1?.symbol ?? '',
            this.chartTheme.colorAt(7)
        );
    }

    private formatMonth(monthStr: Date | string): string {
        const date = new Date(monthStr);
        const label = date.toLocaleString('es-AR', { month: 'long' });
        return label.charAt(0).toUpperCase() + label.slice(1);
    }

    private buildSingleBarOptions(labels: string[], values: number[], currency: string, color: string): EChartsOption {
        const fmt = (v: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(v);
        const axisLabel = this.chartTheme.surface.axisLabel;
        return {
            color: [color],
            grid: { left: 70, right: 20, top: 30, bottom: 60 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: {
                type: 'category', data: labels,
                axisLabel: { color: axisLabel, rotate: labels.length > 6 ? 30 : 0 },
                axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } },
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) },
                splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } },
            },
            series: [{ type: 'bar', data: values, label: { show: true, position: 'top', color: axisLabel, formatter: (p: any) => fmt(p.value) } }],
        };
    }
}
