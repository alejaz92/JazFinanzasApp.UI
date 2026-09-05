import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { EChartsOption } from 'echarts';

import { CardReportService } from '../services/card-report.service';
import { CardDetailReport } from '../models/card-report.model';
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

    constructor() {
        this.cardService.getAllCards().subscribe(cards => {
            this.cards = cards;
            this.isLoadingCards = false;
            if (cards.length > 0) {
                this.selectedCardId = cards[0].id;
                this.tryLoad();
            }
        });

        effect(() => {
            this.reportContext.currencyAssetId(); // dependencia reactiva
            this.tryLoad();
        });
    }

    onCardChange(): void {
        this.tryLoad();
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

        this.evolutionChartOptions = {
            color: [this.detail!.pesoAssetColor, this.detail!.dollarAssetColor],
            legend: { top: 0, data: [this.detail!.pesoAssetSymbol, this.detail!.dollarAssetSymbol], textStyle: { color: axisLabel } },
            grid: { left: 70, right: 20, top: 40, bottom: 40 },
            tooltip: { trigger: 'axis', ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'category', data: labels, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series: [
                { name: this.detail!.pesoAssetSymbol, type: 'line', showSymbol: false, data: evolution.map(e => e.pesosAmount) },
                { name: this.detail!.dollarAssetSymbol, type: 'line', showSymbol: false, data: evolution.map(e => e.dollarsAmount) },
            ],
        } as EChartsOption;
    }

    get hasCategories(): boolean {
        return (this.detail?.byCategory.length ?? 0) > 0;
    }
}
