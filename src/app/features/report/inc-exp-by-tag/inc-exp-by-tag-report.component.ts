import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import type { EChartsOption } from 'echarts';

import { IncomeExpenseService } from '../services/income-expense.service';
import { TagSpending } from '../models/income-expense.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

const MONTHS = 6;

@Component({
    selector: 'app-inc-exp-by-tag-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, CurrencyFiatFormatPipe, ChartComponent],
    templateUrl: './inc-exp-by-tag-report.component.html',
    styleUrl: './inc-exp-by-tag-report.component.css'
})
export class IncExpByTagReportComponent {
    private readonly incomeExpenseService = inject(IncomeExpenseService);
    private readonly chartTheme = inject(ChartThemeService);
    private readonly router = inject(Router);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = false;
    dataRequested = false;
    tags: TagSpending[] = [];

    evolutionByTag: Record<number, EChartsOption> = {};

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) this.load(assetId);
        });
    }

    private load(assetId: number): void {
        this.isLoading = true;
        this.dataRequested = true;
        this.incomeExpenseService.getByTag(assetId, MONTHS).subscribe(data => {
            this.tags = data;
            this.isLoading = false;
            setTimeout(() => this.renderEvolutions(), 0);
        });
    }

    // Drill-down por etiqueta (sección 7, "drill-down universal"), acotado a la misma ventana de
    // meses que ya se está mostrando.
    openTag(tag: TagSpending): void {
        const today = new Date();
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const from = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() - (MONTHS - 1), 1);
        const to = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 1);
        this.router.navigate(['/transactions'], {
            queryParams: {
                tagId: tag.tagId,
                from: this.toDateParam(from),
                to: this.toDateParam(to),
                label: `#${tag.tagName} — últimos ${MONTHS} meses`,
            },
        });
    }

    private toDateParam(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}-01`;
    }

    private renderEvolutions(): void {
        for (const tag of this.tags) {
            const labels = tag.monthlyEvolution.map(m => new Date(m.month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));
            const values = tag.monthlyEvolution.map(m => m.amount);
            this.evolutionByTag[tag.tagId] = this.chartTheme.lineOptions(labels, values, {
                formatValue: (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 }),
            });
        }
    }
}
