import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { EChartsOption } from 'echarts';

import { IncomeExpenseService } from '../services/income-expense.service';
import { IncomeCategorySeries, IncomeComposition, IncomeCategoryDay } from '../models/income-expense.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

const EVOLUTION_MONTHS = 24;
const PAYDAY_MONTHS = 12;

type PayDayStyle = 'table' | 'timeline' | 'calendar';

interface CategoryPayDayStat {
    categoryName: string;
    typicalDay: number;
    frequencyPct: number;
    averageAmount: number;
    occurrences: number;
}

@Component({
    selector: 'app-inc-income-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, CurrencyFiatFormatPipe, ChartComponent],
    templateUrl: './inc-income-report.component.html',
    styleUrl: './inc-income-report.component.css'
})
export class IncIncomeReportComponent {
    private readonly incomeExpenseService = inject(IncomeExpenseService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = false;
    dataRequested = false;

    // Composición de un mes elegido — lo principal (corrección 2026-09-04, segunda vuelta: el
    // usuario pidió expresamente poder elegir un mes y ver la composición, no una evolución).
    currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    composition: IncomeComposition | null = null;
    compositionOptions: EChartsOption = {};

    // Evolución en el tiempo — secundaria, queda como complemento debajo de la composición.
    categories: IncomeCategorySeries[] = [];
    evolutionOptions: EChartsOption = {};

    // Días de cobro — comparación en vivo de 3 formas (2026-09-04, tercera vuelta): la versión
    // anterior mezclaba todas las categorías en un solo día-del-mes, y el usuario pidió poder ver
    // el patrón de cada categoría por separado.
    dayRows: IncomeCategoryDay[] = [];
    payDayStyle: PayDayStyle = 'table';
    readonly payDayStyleOptions: { value: PayDayStyle; label: string }[] = [
        { value: 'table', label: 'Tabla por categoría' },
        { value: 'timeline', label: 'Timeline por categoría' },
        { value: 'calendar', label: 'Calendario por categoría' },
    ];
    categoryStats: CategoryPayDayStat[] = [];
    categoryNames: string[] = [];
    selectedCategoryForCalendar: string | null = null;
    timelineOptions: EChartsOption = {};
    categoryCalendarOptions: EChartsOption = {};

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) this.load(assetId);
        });
    }

    private load(assetId: number): void {
        this.isLoading = true;
        this.dataRequested = true;

        this.incomeExpenseService.getIncomeComposition(assetId, this.toMonthParam(this.currentMonth)).subscribe(data => {
            this.composition = data;
            this.isLoading = false;
            this.renderComposition();
        });

        this.incomeExpenseService.getIncomeByCategory(assetId, EVOLUTION_MONTHS).subscribe(data => {
            this.categories = data;
            this.renderEvolution();
        });

        this.incomeExpenseService.getIncomeByCategoryAndDay(assetId, PAYDAY_MONTHS).subscribe(data => {
            this.dayRows = data;
            this.categoryNames = [...new Set(data.map(r => r.categoryName))];
            this.selectedCategoryForCalendar = this.categoryNames[0] ?? null;
            this.categoryStats = this.computeCategoryStats();
            this.renderPayDayCharts();
        });
    }

    previousMonth(): void {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
        const assetId = this.reportContext.currencyAssetId();
        if (assetId != null) this.loadComposition(assetId);
    }

    nextMonth(): void {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
        const assetId = this.reportContext.currencyAssetId();
        if (assetId != null) this.loadComposition(assetId);
    }

    private loadComposition(assetId: number): void {
        this.incomeExpenseService.getIncomeComposition(assetId, this.toMonthParam(this.currentMonth)).subscribe(data => {
            this.composition = data;
            this.renderComposition();
        });
    }

    get monthLabel(): string {
        return this.currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    }

    get compositionTotal(): number {
        return this.composition?.categories.reduce((sum, c) => sum + c.amount, 0) ?? 0;
    }

    setPayDayStyle(style: PayDayStyle): void {
        this.payDayStyle = style;
        setTimeout(() => this.renderPayDayCharts(), 0);
    }

    onCalendarCategoryChange(): void {
        setTimeout(() => this.renderCategoryCalendar(), 0);
    }

    private toMonthParam(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}-01`;
    }

    private renderComposition(): void {
        if (!this.composition || this.composition.categories.length === 0) return;
        const labels = this.composition.categories.map(c => c.categoryName);
        const values = this.composition.categories.map(c => c.amount);
        this.compositionOptions = this.chartTheme.pieOptions(labels, values, {
            donut: true, showLegend: true,
            formatValue: (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 }),
        });
    }

    private renderEvolution(): void {
        if (this.categories.length === 0) return;
        const today = new Date();
        const labels: string[] = [];
        for (let i = EVOLUTION_MONTHS - 1; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            labels.push(d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }));
        }

        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        this.evolutionOptions = {
            color: this.categories.map((_, i) => this.chartTheme.colorAt(i)),
            legend: { top: 0, textStyle: { color: axisLabel } },
            grid: { left: 80, right: 20, top: 40, bottom: 40 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: {
                type: 'category', data: labels,
                axisLabel: { color: axisLabel, interval: Math.ceil(EVOLUTION_MONTHS / 12) - 1 },
                axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } },
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) },
                splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } },
            },
            series: this.categories.map(c => ({
                name: c.categoryName,
                type: 'bar',
                stack: 'total',
                data: c.monthlyTrend,
            })),
        };
    }

    // "Día típico" de una categoría: el día del mes donde más veces cayó su ingreso (no el
    // promedio ponderado por monto) — la frecuencia es relativa a los propios cobros de esa
    // categoría, para no diluirla contra meses en que directamente no aplica (ej. un reintegro
    // ocasional no compite en la misma escala que el sueldo mensual).
    private computeCategoryStats(): CategoryPayDayStat[] {
        const byCategory = new Map<string, IncomeCategoryDay[]>();
        for (const r of this.dayRows) {
            if (!byCategory.has(r.categoryName)) byCategory.set(r.categoryName, []);
            byCategory.get(r.categoryName)!.push(r);
        }

        const stats: CategoryPayDayStat[] = [];
        for (const [categoryName, rows] of byCategory) {
            const byDay = new Map<number, IncomeCategoryDay[]>();
            for (const r of rows) {
                const day = new Date(r.date).getDate();
                if (!byDay.has(day)) byDay.set(day, []);
                byDay.get(day)!.push(r);
            }

            let typicalDay = 0;
            let maxCount = 0;
            for (const [day, dayRows] of byDay) {
                if (dayRows.length > maxCount) { maxCount = dayRows.length; typicalDay = day; }
            }

            const typicalRows = byDay.get(typicalDay) ?? [];
            const averageAmount = typicalRows.reduce((sum, r) => sum + r.amount, 0) / (typicalRows.length || 1);
            const frequencyPct = Math.round((maxCount / rows.length) * 1000) / 10;

            stats.push({ categoryName, typicalDay, frequencyPct, averageAmount, occurrences: rows.length });
        }

        return stats.sort((a, b) => b.occurrences - a.occurrences);
    }

    private renderPayDayCharts(): void {
        if (this.payDayStyle === 'timeline') this.renderTimeline();
        if (this.payDayStyle === 'calendar') this.renderCategoryCalendar();
    }

    private renderTimeline(): void {
        if (this.dayRows.length === 0) return;
        const categories = this.categoryNames;
        const maxAmount = Math.max(...this.dayRows.map(r => r.amount), 1);
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        const color = this.chartTheme.colorAt(2);

        const data = this.dayRows.map(r => [new Date(r.date).getDate(), categories.indexOf(r.categoryName), r.amount]);

        this.timelineOptions = {
            tooltip: {
                ...this.chartTheme.tooltipDefaults(),
                formatter: (p: unknown) => {
                    const v = (p as { value: number[] }).value;
                    return `${categories[v[1]]} — día ${v[0]}: ${fmt(v[2])}`;
                },
            },
            grid: { left: 150, right: 30, top: 20, bottom: 40 },
            xAxis: {
                type: 'value', min: 1, max: 31, interval: 1,
                axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } },
                splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } },
            },
            yAxis: { type: 'category', data: categories, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            series: [{
                type: 'scatter',
                symbolSize: (val: number[]) => 8 + 22 * (val[2] / maxAmount),
                itemStyle: { color, opacity: 0.75 },
                data,
            }],
        };
    }

    private renderCategoryCalendar(): void {
        if (!this.selectedCategoryForCalendar) return;
        const rows = this.dayRows.filter(r => r.categoryName === this.selectedCategoryForCalendar);
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        const amounts = rows.map(r => r.amount);
        const max = amounts.length > 0 ? Math.max(...amounts) : 1;

        const today = new Date();
        const rangeStart = new Date(today.getFullYear(), today.getMonth() - (PAYDAY_MONTHS - 1), 1);
        const toIso = (d: Date) => `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;

        this.categoryCalendarOptions = {
            tooltip: {
                ...this.chartTheme.tooltipDefaults(),
                formatter: (p: unknown) => {
                    const v = (p as { value: [string, number] }).value;
                    const [y, m, d] = v[0].split('-');
                    return `${d}/${m}/${y}: ${fmt(v[1])}`;
                },
            },
            visualMap: {
                min: 0, max, calculable: false, orient: 'horizontal', left: 'center', top: 0,
                inRange: { color: [this.chartTheme.surface.splitLine, this.chartTheme.colorAt(2)] },
                textStyle: { color: axisLabel },
            },
            calendar: {
                top: 60,
                range: [toIso(rangeStart), toIso(today)],
                cellSize: ['auto', 16],
                itemStyle: { borderColor: this.chartTheme.surface.axisLine, borderWidth: 1 },
                yearLabel: { show: false },
                dayLabel: { color: axisLabel },
                monthLabel: { color: axisLabel },
            },
            series: [{
                type: 'heatmap',
                coordinateSystem: 'calendar',
                data: rows.map(r => [r.date.substring(0, 10), r.amount]),
            }],
        };
    }
}
