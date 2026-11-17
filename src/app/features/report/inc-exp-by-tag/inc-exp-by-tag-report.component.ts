import { Component, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { IncomeExpenseService } from '../services/income-expense.service';
import { SpendingRow, TagSpending } from '../models/income-expense.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { SpendingMeasureNoticeComponent } from '../../../shared/components/spending-measure-notice/spending-measure-notice.component';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { InfoButtonComponent } from '../../../shared/components/info-button/info-button.component';
import { SpendingRowsTableComponent } from '../../../shared/components/spending-rows-table/spending-rows-table.component';

declare const bootstrap: any;

const MONTHS = 6;

@Component({
    selector: 'app-inc-exp-by-tag-report',
    standalone: true,
    imports: [SpendingMeasureNoticeComponent, SpendingRowsTableComponent, LoadingComponent, NgIf, NgFor, CurrencyFiatFormatPipe, ChartComponent, InfoButtonComponent],
    templateUrl: './inc-exp-by-tag-report.component.html',
    styleUrl: './inc-exp-by-tag-report.component.css'
})
export class IncExpByTagReportComponent {
    private readonly incomeExpenseService = inject(IncomeExpenseService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = false;
    dataRequested = false;
    tags: TagSpending[] = [];

    evolutionByTag: Record<number, EChartsOption> = {};

    // Panel lateral con los gastos de la etiqueta elegida (Fase 9): antes el clic navegaba a /transactions, que no lista las compras con tarjeta.
    selectedTag: TagSpending | null = null;
    tagRows: SpendingRow[] = [];
    isLoadingRows = false;

    @ViewChild('drawerRef') private drawerRef?: ElementRef<HTMLElement>;
    private drawerInstance: any;

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) this.load(assetId);
        });
    }

    private load(assetId: number): void {
        // Un panel abierto es de la moneda anterior: al volver a pedir el reporte se cierra.
        this.closeDetail();
        this.isLoading = true;
        this.dataRequested = true;
        this.incomeExpenseService.getByTag(assetId, MONTHS).subscribe(data => {
            this.tags = data;
            this.isLoading = false;
            setTimeout(() => this.renderEvolutions(), 0);
        });
    }

    // Drill-down por etiqueta (sección 7, "drill-down universal"): panel lateral con los gastos de la etiqueta, acotado a la misma ventana de meses que ya se
    // está mostrando. Es la misma medida del reporte (por compra), así que la suma de las filas es el número de la tarjeta.
    openTag(tag: TagSpending): void {
        const assetId = this.reportContext.currencyAssetId();
        if (assetId == null) return;

        const today = new Date();
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const from = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() - (MONTHS - 1), 1);
        const to = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 1);

        this.selectedTag = tag;
        this.tagRows = [];
        this.isLoadingRows = true;
        this.incomeExpenseService.getSpendingRows(assetId, this.toDateParam(from), this.toDateParam(to), { tagId: tag.tagId }).subscribe(rows => {
            this.tagRows = rows;
            this.isLoadingRows = false;
        });
        this.openDrawer();
    }

    closeDetail(): void {
        this.selectedTag = null;
        this.tagRows = [];
        this.drawerInstance?.hide();
    }

    private openDrawer(): void {
        setTimeout(() => {
            const el = this.drawerRef?.nativeElement;
            if (!el) return;
            this.drawerInstance = bootstrap.Offcanvas.getOrCreateInstance(el);
            this.drawerInstance.show();
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
