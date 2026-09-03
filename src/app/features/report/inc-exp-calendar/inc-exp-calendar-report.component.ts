import { Component, effect, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import type { EChartsOption, ECElementEvent } from 'echarts';

import { IncomeExpenseService } from '../services/income-expense.service';
import { SpendingCalendar } from '../models/income-expense.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
// Lunes a domingo para la lectura habitual de una semana en Argentina; el backend numera 0=domingo.
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

@Component({
    selector: 'app-inc-exp-calendar-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, ChartComponent],
    templateUrl: './inc-exp-calendar-report.component.html',
    styleUrl: './inc-exp-calendar-report.component.css'
})
export class IncExpCalendarReportComponent {
    private readonly incomeExpenseService = inject(IncomeExpenseService);
    private readonly chartTheme = inject(ChartThemeService);
    private readonly router = inject(Router);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = false;
    dataRequested = false;
    year = new Date().getFullYear();
    data: SpendingCalendar | null = null;

    calendarOptions: EChartsOption = {};
    weekdayOptions: EChartsOption = {};

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) this.load(assetId);
        });
    }

    private load(assetId: number): void {
        this.isLoading = true;
        this.dataRequested = true;
        this.incomeExpenseService.getCalendar(assetId, this.year).subscribe(data => {
            this.data = data;
            this.isLoading = false;
            setTimeout(() => this.renderCharts(), 0);
        });
    }

    previousYear(): void {
        this.year--;
        const assetId = this.reportContext.currencyAssetId();
        if (assetId != null) this.load(assetId);
    }

    nextYear(): void {
        this.year++;
        const assetId = this.reportContext.currencyAssetId();
        if (assetId != null) this.load(assetId);
    }

    // Drill-down: clic en un día del mapa de calor lleva a sus movimientos de ese día.
    onCalendarClick(event: ECElementEvent): void {
        const value = event.value as [string, number] | undefined;
        if (!value) return;
        const date = value[0]; // "yyyy-MM-dd", tal cual la manda el backend

        // Nada de `new Date(date)`: un string sin hora se parsea como UTC medianoche, y con
        // getters locales en un huso negativo (UTC-3, Argentina) el día calculado queda un día
        // antes — from/to terminaban coincidiendo. Se opera sobre año/mes/día en UTC, sin pasar
        // nunca por la hora local.
        const [year, month, day] = date.split('-').map(Number);
        const next = new Date(Date.UTC(year, month - 1, day + 1));
        const to = `${next.getUTCFullYear()}-${(next.getUTCMonth() + 1).toString().padStart(2, '0')}-${next.getUTCDate().toString().padStart(2, '0')}`;

        this.router.navigate(['/transactions'], {
            queryParams: {
                from: date,
                to,
                label: `Gastos del ${day}/${month}/${year}`,
            },
        });
    }

    private renderCharts(): void {
        if (!this.data) return;
        this.renderCalendar();
        this.renderWeekdays();
    }

    private renderCalendar(): void {
        if (!this.data) return;
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        const amounts = this.data.days.map(d => d.amount);
        const max = amounts.length > 0 ? Math.max(...amounts) : 0;

        this.calendarOptions = {
            tooltip: {
                ...this.chartTheme.tooltipDefaults(),
                formatter: (p: unknown) => {
                    const params = p as { value: [string, number] };
                    // Sin `new Date(...)`: mismo motivo que en onCalendarClick, un string de solo
                    // fecha se interpreta como UTC y en UTC-3 el día mostrado queda uno antes.
                    const [year, month, day] = params.value[0].split('-');
                    return `${day}/${month}/${year}: ${fmt(params.value[1])}`;
                },
            },
            visualMap: {
                min: 0, max: max || 1,
                calculable: false, orient: 'horizontal', left: 'center', top: 0,
                inRange: { color: [this.chartTheme.surface.splitLine, this.chartTheme.colorAt(7)] },
                textStyle: { color: axisLabel },
            },
            calendar: {
                top: 60,
                range: this.year,
                cellSize: ['auto', 16],
                itemStyle: { borderColor: this.chartTheme.surface.axisLine, borderWidth: 1 },
                yearLabel: { show: false },
                dayLabel: { color: axisLabel },
                monthLabel: { color: axisLabel },
            },
            series: [{
                type: 'heatmap',
                coordinateSystem: 'calendar',
                data: this.data.days.map(d => [d.date.substring(0, 10), d.amount]),
            }],
        };
    }

    private renderWeekdays(): void {
        if (!this.data) return;
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        const values = WEEKDAY_ORDER.map(dow => this.data!.weekdayAverages.find(w => w.dayOfWeek === dow)?.average ?? 0);
        const labels = WEEKDAY_ORDER.map(dow => WEEKDAY_LABELS[dow]);

        this.weekdayOptions = {
            grid: { left: 70, right: 20, top: 20, bottom: 30 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'category', data: labels, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series: [{ type: 'bar', data: values, itemStyle: { color: this.chartTheme.colorAt(7) } }],
        };
    }
}
