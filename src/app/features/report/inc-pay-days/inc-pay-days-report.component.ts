import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { EChartsOption } from 'echarts';

import { IncomeExpenseService } from '../services/income-expense.service';
import { IncomeCategoryDay } from '../models/income-expense.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

const PAYDAY_MONTHS = 12;

interface CategoryPayDayStat {
    categoryName: string;
    typicalDay: number;
    frequencyPct: number;
    averageAmount: number;
    occurrences: number;
    avgDeviationDays: number;
}

interface TimelinePoint {
    categoryName: string;
    day: number;
    averageAmount: number;
    occurrences: number;
}

@Component({
    selector: 'app-inc-pay-days-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, CurrencyFiatFormatPipe, ChartComponent],
    templateUrl: './inc-pay-days-report.component.html',
    styleUrl: './inc-pay-days-report.component.css'
})
export class IncPayDaysReportComponent {
    private readonly incomeExpenseService = inject(IncomeExpenseService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = false;
    dataRequested = false;

    // Separado de "Ingresos" a pedido del usuario (2026-09-04, cuarta vuelta: "me gustan todos [los
    // 3 estilos], tal vez lo separaria del resto de ingresos en otro reporte"), y luego (quinta
    // vuelta, mismo día) el selector de estilo se sacó entero: al tener pantalla propia, mostrar las
    // 3 variantes juntas en vez de obligar a elegir una.
    dayRows: IncomeCategoryDay[] = [];
    categoryStats: CategoryPayDayStat[] = [];
    categoryNames: string[] = [];

    // Filtro de categorías del timeline — a pedido: "me gustaria a mi elegir que categorias ver".
    selectedTimelineCategories = new Set<string>();

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

        this.incomeExpenseService.getIncomeByCategoryAndDay(assetId, PAYDAY_MONTHS).subscribe(data => {
            this.dayRows = data;
            this.categoryNames = [...new Set(data.map(r => r.categoryName))];
            this.selectedTimelineCategories = new Set(this.categoryNames);
            this.selectedCategoryForCalendar = this.categoryNames[0] ?? null;
            this.categoryStats = this.computeCategoryStats();
            this.isLoading = false;
            setTimeout(() => this.renderCharts(), 0);
        });
    }

    toggleTimelineCategory(name: string): void {
        if (this.selectedTimelineCategories.has(name)) this.selectedTimelineCategories.delete(name);
        else this.selectedTimelineCategories.add(name);
        this.renderTimeline();
    }

    onCalendarCategoryChange(): void {
        setTimeout(() => this.renderCategoryCalendar(), 0);
    }

    private renderCharts(): void {
        this.renderTimeline();
        this.renderCategoryCalendar();
    }

    // "Día típico" de una categoría: el día del mes donde más veces cayó su ingreso. La frecuencia
    // y el desvío son relativos a los propios cobros de esa categoría (no se diluyen contra otras).
    // Desvío: promedio de |día real - día típico| sobre TODAS las ocurrencias — un desvío alto dice
    // que, aunque haya un día típico, la fecha real varía bastante mes a mes.
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

            const totalDeviation = rows.reduce((sum, r) => sum + Math.abs(new Date(r.date).getDate() - typicalDay), 0);
            const avgDeviationDays = Math.round((totalDeviation / rows.length) * 10) / 10;

            stats.push({ categoryName, typicalDay, frequencyPct, averageAmount, occurrences: rows.length, avgDeviationDays });
        }

        return stats.sort((a, b) => b.occurrences - a.occurrences);
    }

    // Un punto por (categoría, día) en vez de uno por transacción: antes, dos cobros del mismo
    // sueldo en el mismo día-del-mes pero distinto mes quedaban exactamente superpuestos en el
    // gráfico y el tooltip solo mostraba uno de los dos, dando la falsa impresión de ser un valor
    // puntual. Acá sí es un promedio real, y el tamaño pasa a representar la frecuencia (cuántas
    // veces cayó ese día) en vez del monto, que es lo que hace que la lectura de dónde se agrupan
    // los cobros de una categoría sea directa.
    private computeTimelinePoints(): TimelinePoint[] {
        const byKey = new Map<string, IncomeCategoryDay[]>();
        for (const r of this.dayRows) {
            if (!this.selectedTimelineCategories.has(r.categoryName)) continue;
            const day = new Date(r.date).getDate();
            const key = `${r.categoryName}|${day}`;
            if (!byKey.has(key)) byKey.set(key, []);
            byKey.get(key)!.push(r);
        }

        return [...byKey.values()].map(group => ({
            categoryName: group[0].categoryName,
            day: new Date(group[0].date).getDate(),
            averageAmount: group.reduce((sum, r) => sum + r.amount, 0) / group.length,
            occurrences: group.length,
        }));
    }

    private renderTimeline(): void {
        const points = this.computeTimelinePoints();
        const categories = this.categoryNames.filter(c => this.selectedTimelineCategories.has(c));
        if (points.length === 0 || categories.length === 0) {
            this.timelineOptions = {};
            return;
        }

        const maxOccurrences = Math.max(...points.map(p => p.occurrences), 1);
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        const color = this.chartTheme.colorAt(2);

        const data = points.map(p => [p.day, categories.indexOf(p.categoryName), p.occurrences, p.averageAmount]);

        this.timelineOptions = {
            tooltip: {
                ...this.chartTheme.tooltipDefaults(),
                formatter: (p: unknown) => {
                    const v = (p as { value: number[] }).value;
                    return `${categories[v[1]]} — día ${v[0]}: promedio ${fmt(v[3])} (${v[2]} ${v[2] === 1 ? 'vez' : 'veces'})`;
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
                symbolSize: (val: number[]) => 6 + 22 * (val[2] / maxOccurrences),
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
