import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { EChartsOption } from 'echarts';

import { CardReportService } from '../services/card-report.service';
import { CardDetailReport } from '../models/card-report.model';
import { CardService } from '../../card/services/card.service';
import { Card } from '../../card/models/card.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

// Tarjetas — Por tarjeta (Fase 15): ficha de una tarjeta (próximo cierre/vencimiento, consumo del
// mes, composición por categoría y evolución mensual), sobre CardReportController.GetByCardAsync.
@Component({
    selector: 'app-cards-by-card-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, DatePipe, CurrencyFiatFormatPipe, ChartComponent],
    templateUrl: './cards-by-card-report.component.html',
    styleUrl: './cards-by-card-report.component.css'
})
export class CardsByCardReportComponent implements OnInit {
    private readonly cardReportService = inject(CardReportService);
    private readonly cardService = inject(CardService);
    private readonly chartTheme = inject(ChartThemeService);

    isLoadingCards = true;
    isLoading = false;
    cards: Card[] = [];
    selectedCardId: number | null = null;
    detail: CardDetailReport | null = null;

    categoryChartOptions: EChartsOption = {};
    evolutionChartOptions: EChartsOption = {};

    ngOnInit(): void {
        this.cardService.getAllCards().subscribe(cards => {
            this.cards = cards;
            this.isLoadingCards = false;
            if (cards.length > 0) {
                this.selectedCardId = cards[0].id;
                this.load();
            }
        });
    }

    load(): void {
        if (this.selectedCardId == null) return;
        this.isLoading = true;
        this.detail = null;
        this.cardReportService.getByCard(this.selectedCardId).subscribe(data => {
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

    private renderCategoryChart(): void {
        const categories = this.detail!.byCategory;
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        this.categoryChartOptions = {
            grid: { left: 140, right: 30, top: 20, bottom: 30 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            yAxis: { type: 'category', data: categories.map(c => c.transactionClassName), axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            series: [{
                name: 'Pesos',
                type: 'bar',
                data: categories.map(c => c.pesosAmount),
                itemStyle: { color: (p: any) => this.chartTheme.colorAt(p.dataIndex) },
            }],
        };
    }

    private renderEvolutionChart(): void {
        const evolution = this.detail!.monthlyEvolution;
        const labels = evolution.map(e => new Date(e.month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        this.evolutionChartOptions = {
            color: [this.chartTheme.colorAt(0), this.chartTheme.colorAt(1)],
            legend: { top: 0, textStyle: { color: axisLabel } },
            grid: { left: 70, right: 20, top: 40, bottom: 40 },
            tooltip: { trigger: 'axis', ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'category', data: labels, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series: [
                { name: 'Pesos', type: 'line', showSymbol: false, data: evolution.map(e => e.pesosAmount), itemStyle: { color: this.chartTheme.colorAt(0) } },
                { name: 'Dólares', type: 'line', showSymbol: false, data: evolution.map(e => e.dollarsAmount), itemStyle: { color: this.chartTheme.colorAt(1) } },
            ],
        } as EChartsOption;
    }

    get hasCategories(): boolean {
        return (this.detail?.byCategory.length ?? 0) > 0;
    }
}
