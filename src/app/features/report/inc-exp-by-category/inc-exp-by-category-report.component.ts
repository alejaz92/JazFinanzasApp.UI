import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import type { EChartsOption } from 'echarts';

import { IncomeExpenseService } from '../services/income-expense.service';
import { CategoryDetail, CategoryGroup, SpendingByCategory } from '../models/income-expense.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

@Component({
    selector: 'app-inc-exp-by-category-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, DecimalPipe, CurrencyFiatFormatPipe, ChartComponent],
    templateUrl: './inc-exp-by-category-report.component.html',
    styleUrl: './inc-exp-by-category-report.component.css'
})
export class IncExpByCategoryReportComponent {
    private readonly incomeExpenseService = inject(IncomeExpenseService);
    private readonly chartTheme = inject(ChartThemeService);
    private readonly router = inject(Router);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = false;
    dataRequested = false;
    currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    data: SpendingByCategory | null = null;

    sparklineByCategory: Record<number, EChartsOption> = {};

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) this.load(assetId);
        });
    }

    private load(assetId: number): void {
        this.isLoading = true;
        this.dataRequested = true;
        const monthParam = this.toMonthParam(this.currentMonth);
        this.incomeExpenseService.getByCategory(assetId, monthParam).subscribe(data => {
            this.data = data;
            this.isLoading = false;
            setTimeout(() => this.renderSparklines(), 0);
        });
    }

    previousMonth(): void {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
        const assetId = this.reportContext.currencyAssetId();
        if (assetId != null) this.load(assetId);
    }

    nextMonth(): void {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
        const assetId = this.reportContext.currencyAssetId();
        if (assetId != null) this.load(assetId);
    }

    get monthLabel(): string {
        return this.currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    }

    get totalAmount(): number {
        return this.data?.groups.reduce((sum, g) => sum + g.amount, 0) ?? 0;
    }

    groupPct(group: CategoryGroup): number {
        return this.totalAmount > 0 ? (group.amount / this.totalAmount) * 100 : 0;
    }

    // Drill-down (Flujo 3 del plan): clic en una categoría lleva a sus movimientos del mes, filtrados
    // por clase — sección 7, "drill-down universal".
    openCategory(category: CategoryDetail): void {
        const from = this.toMonthParam(this.currentMonth);
        const nextMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
        const to = this.toMonthParam(nextMonth);
        this.router.navigate(['/transactions'], {
            queryParams: {
                classId: category.categoryId,
                from,
                to,
                label: `${category.categoryName} — ${this.monthLabel}`,
            },
        });
    }

    rankDelta(category: CategoryDetail): number | null {
        if (category.rankPrevious == null) return null;
        return category.rankPrevious - category.rankCurrent;
    }

    private toMonthParam(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}-01`;
    }

    // Mini-línea por fila, sin ejes ni tooltip — solo la forma de la tendencia de los últimos meses.
    private renderSparklines(): void {
        if (!this.data) return;
        const color = this.chartTheme.colorAt(7);
        for (const group of this.data.groups) {
            for (const category of group.categories) {
                this.sparklineByCategory[category.categoryId] = {
                    grid: { left: 0, right: 0, top: 4, bottom: 4 },
                    xAxis: { type: 'category', show: false, data: category.monthlyTrend.map((_, i) => i) },
                    yAxis: { type: 'value', show: false },
                    series: [{ type: 'line', data: category.monthlyTrend, showSymbol: false, lineStyle: { width: 1.5, color } }],
                };
            }
        }
    }
}
