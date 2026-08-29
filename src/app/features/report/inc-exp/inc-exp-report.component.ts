import { Component, OnInit, effect } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { EChartsOption } from 'echarts';

import { ReportService } from '../services/report.service';
import { ReportContextService } from '../services/report-context.service';
import { IncExpStats } from '../models/IncExpStats.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';

@Component({
    selector: 'app-inc-exp-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, FormsModule, ChartComponent],
    templateUrl: './inc-exp-report.component.html'
})
export class IncExpReportComponent implements OnInit {
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
        private chartThemeService: ChartThemeService,
        public reportContext: ReportContextService
    ) {
        // La moneda ya no se elige acá: viene de la barra de período/moneda del shell
        // (Fase 4, docs/plans/activos/plan-rediseno-reportes.md). Recarga sola apenas
        // ReportContextService resuelve la referencia principal, y de nuevo si el usuario
        // la cambia desde la barra.
        effect(() => {
            if (this.reportContext.currentCurrency()) this.loadIncExpStats();
        });
    }

    ngOnInit(): void {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        this.selectedMonthDB1 = `${year}-${month}`;
    }

    // Ya no hay una carga local de "lista de monedas": la resuelve ReportContextService,
    // compartida por todos los reportes. Mientras no haya moneda todavía no hay nada que mostrar.
    get isLoading(): boolean {
        return !this.reportContext.currentCurrency();
    }

    loadIncExpStats(): void {
        const currency = this.reportContext.currentCurrency();
        if (!currency || !this.selectedMonthDB1) {
            this.viewAux = false;
            return;
        }

        this.isLoadingGraph = true;
        this.viewAux = false;

        this.reportService.getIncExpStats(this.selectedMonthDB1, currency.id)
            .subscribe(response => {
                this.incExpStats = response;
                this.isLoadingGraph = false;
                this.buildChartOptions(currency.symbol);
                this.viewAux = true;
            });
    }

    private buildChartOptions(currency: string): void {
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
