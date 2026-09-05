import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { EChartsOption } from 'echarts';

import { CardReportService } from '../services/card-report.service';
import { CardDetailReport } from '../models/card-report.model';
import { CardTransactionPaymentList } from '../../cardTransactions/models/CardTransactionPayment-List.model';
import { CardService } from '../../card/services/card.service';
import { Card } from '../../card/models/card.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { ContrastTextPipe } from '../../../shared/pipes/contrastText/contrast-text.pipe';

// Tarjetas — Por tarjeta (Fase 15): ficha de una tarjeta (próximo cierre/vencimiento, consumo del
// mes, composición por categoría y evolución mensual), sobre CardReportController.GetByCardAsync.
// Corrección 2026-09-05: todos los montos vienen convertidos a la moneda elegida en la barra de
// Reportes, y las series de pesos/dólares usan el mismo color por moneda que Patrimonio → General.
@Component({
    selector: 'app-cards-by-card-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, DatePipe, CurrencyFiatFormatPipe, ContrastTextPipe, ChartComponent],
    templateUrl: './cards-by-card-report.component.html',
    styleUrl: './cards-by-card-report.component.css'
})
export class CardsByCardReportComponent {
    private readonly cardReportService = inject(CardReportService);
    private readonly cardService = inject(CardService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoadingCards = true;
    isLoading = false;
    dataRequested = false;
    cards: Card[] = [];
    selectedCardId: number | null = null;
    detail: CardDetailReport | null = null;

    categoryChartOptions: EChartsOption = {};
    evolutionChartOptions: EChartsOption = {};

    // Corrección 2026-09-05, tercera ronda: el usuario pidió ver la evolución mensual unificada
    // (pesos + dólares ya convertidos a la misma moneda de referencia — sumarlos es válido, a
    // diferencia de sumar montos nativos sin convertir). Toggle en vez de agregar una tercera línea
    // al gráfico de por moneda: mezclar "por moneda" y "total" en el mismo gráfico es más difícil de
    // leer que elegir uno de los dos.
    showCombinedEvolution = false;

    onEvolutionViewChange(): void {
        this.renderEvolutionChart();
    }

    // Resumen del mes de esta tarjeta (corrección 2026-09-05, segunda ronda): mismo patrón de
    // navegación que Tarjetas → General, filtrado a `selectedCardId` en vez de traer todas.
    isLoadingSummary = false;
    summaryMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    monthSummary: CardTransactionPaymentList[] = [];

    constructor() {
        this.cardService.getAllCards().subscribe(cards => {
            this.cards = cards;
            this.isLoadingCards = false;
            if (cards.length > 0) {
                this.selectedCardId = cards[0].id;
                this.tryLoad();
                this.loadSummary();
            }
        });

        effect(() => {
            this.reportContext.currencyAssetId(); // dependencia reactiva
            this.tryLoad();
        });
    }

    onCardChange(): void {
        this.tryLoad();
        this.loadSummary();
    }

    private tryLoad(): void {
        const assetId = this.reportContext.currencyAssetId();
        if (assetId == null || this.selectedCardId == null) return;
        this.load(this.selectedCardId, assetId);
    }

    private load(cardId: number, assetId: number): void {
        this.isLoading = true;
        this.dataRequested = true;
        this.detail = null;
        this.cardReportService.getByCard(cardId, assetId).subscribe(data => {
            this.detail = data;
            this.isLoading = false;
            setTimeout(() => this.renderCharts(), 0);
        });
    }

    previousMonth(): void {
        this.summaryMonth = new Date(this.summaryMonth.getFullYear(), this.summaryMonth.getMonth() - 1, 1);
        this.loadSummary();
    }

    nextMonth(): void {
        this.summaryMonth = new Date(this.summaryMonth.getFullYear(), this.summaryMonth.getMonth() + 1, 1);
        this.loadSummary();
    }

    get summaryMonthLabel(): string {
        return this.summaryMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    }

    private loadSummary(): void {
        if (this.selectedCardId == null) return;
        this.isLoadingSummary = true;
        const year = this.summaryMonth.getFullYear();
        const month = (this.summaryMonth.getMonth() + 1).toString().padStart(2, '0');
        this.cardReportService.getMonthSummary(`${year}-${month}-01`, this.selectedCardId).subscribe(data => {
            this.monthSummary = data;
            this.isLoadingSummary = false;
        });
    }

    private renderCharts(): void {
        if (!this.detail) return;
        this.renderCategoryChart();
        this.renderEvolutionChart();
    }

    // Corrección 2026-09-05: antes solo mostraba pesosAmount (una categoría 100% en dólares quedaba
    // invisible) — ahora es una barra apilada con los dos segmentos, coloreados por moneda de origen.
    private renderCategoryChart(): void {
        const categories = this.detail!.byCategory;
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        this.categoryChartOptions = {
            color: [this.detail!.pesoAssetColor, this.detail!.dollarAssetColor],
            legend: { top: 0, data: [this.detail!.pesoAssetSymbol, this.detail!.dollarAssetSymbol], textStyle: { color: axisLabel } },
            grid: { left: 140, right: 30, top: 40, bottom: 30 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            yAxis: { type: 'category', data: categories.map(c => c.transactionClassName), axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            series: [
                { name: this.detail!.pesoAssetSymbol, type: 'bar', stack: 'total', data: categories.map(c => c.pesosAmount) },
                { name: this.detail!.dollarAssetSymbol, type: 'bar', stack: 'total', data: categories.map(c => c.dollarsAmount) },
            ],
        };
    }

    private renderEvolutionChart(): void {
        const evolution = this.detail!.monthlyEvolution;
        const labels = evolution.map(e => new Date(e.month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        // Sumar es válido acá porque los dos ya vienen convertidos a la misma moneda de referencia
        // (corrección 2026-09-05, segunda ronda) — no se están mezclando montos nativos sin convertir.
        const series = this.showCombinedEvolution
            ? [{
                name: `Total en ${this.detail!.referenceAssetSymbol}`,
                type: 'line', showSymbol: false,
                data: evolution.map(e => Math.round((e.pesosAmount + e.dollarsAmount) * 100) / 100),
            }]
            : [
                { name: this.detail!.pesoAssetSymbol, type: 'line', showSymbol: false, data: evolution.map(e => e.pesosAmount) },
                { name: this.detail!.dollarAssetSymbol, type: 'line', showSymbol: false, data: evolution.map(e => e.dollarsAmount) },
            ];

        this.evolutionChartOptions = {
            color: this.showCombinedEvolution ? [this.chartTheme.colorAt(6)] : [this.detail!.pesoAssetColor, this.detail!.dollarAssetColor],
            legend: { top: 0, data: series.map(s => s.name), textStyle: { color: axisLabel } },
            grid: { left: 70, right: 20, top: 40, bottom: 40 },
            tooltip: { trigger: 'axis', ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'category', data: labels, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series,
        } as EChartsOption;
    }

    get hasCategories(): boolean {
        return (this.detail?.byCategory.length ?? 0) > 0;
    }

    // Corrección 2026-09-05, tercera ronda: total del mes en la moneda de referencia — válido porque
    // currentMonthPesos/Dollars ya vienen convertidos a la misma moneda.
    get currentMonthTotal(): number {
        if (!this.detail) return 0;
        return Math.round((this.detail.currentMonthPesos + this.detail.currentMonthDollars) * 100) / 100;
    }
}
