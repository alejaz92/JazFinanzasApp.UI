import { Component, OnInit, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { CardReportService } from '../services/card-report.service';
import { CardFutureCommitment } from '../models/card-report.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';

// Tarjetas — Compromiso futuro (Fase 15): cuánta plata de los próximos meses ya está comprometida
// en cuotas (CardReportController.GetFutureCommitmentAsync, T8 extendido). El checkpoint de esta
// fase pide explícitamente un estado vacío con sentido cuando no hay nada por vencer — no es un
// detalle cosmético, es la respuesta correcta la mayoría de los meses (sección 6, Flujo 4).
@Component({
    selector: 'app-cards-future-commitment-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, ChartComponent],
    templateUrl: './cards-future-commitment-report.component.html',
    styleUrl: './cards-future-commitment-report.component.css'
})
export class CardsFutureCommitmentReportComponent implements OnInit {
    private readonly cardReportService = inject(CardReportService);
    private readonly chartTheme = inject(ChartThemeService);

    isLoading = true;
    data: CardFutureCommitment | null = null;

    stackedOptions: EChartsOption = {};
    ganttOptions: EChartsOption = {};

    ngOnInit(): void {
        this.cardReportService.getFutureCommitment().subscribe(data => {
            this.data = data;
            this.isLoading = false;
            setTimeout(() => this.renderCharts(), 0);
        });
    }

    get hasCommitment(): boolean {
        return (this.data?.timeline.length ?? 0) > 0;
    }

    private renderCharts(): void {
        if (!this.data || !this.hasCommitment) return;
        this.renderStacked();
        this.renderGantt();
    }

    // Columnas apiladas hacia adelante: cada compra en cuotas es una serie propia (un color), para
    // que se vea de una qué compra explica el bulto en un mes puntual.
    private renderStacked(): void {
        const months = this.data!.monthlySeries;
        const labels = months.map(m => new Date(m.month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        const purchaseIds = Array.from(new Set(months.flatMap(m => m.purchases.map(p => p.cardTransactionId))));
        const labelById = new Map(months.flatMap(m => m.purchases).map(p => [p.cardTransactionId, `${p.detail} (${p.cardName})`]));

        this.stackedOptions = {
            color: purchaseIds.map((_, i) => this.chartTheme.colorAt(i)),
            legend: { top: 0, type: 'scroll', textStyle: { color: axisLabel } },
            grid: { left: 70, right: 20, top: 50, bottom: 40 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'category', data: labels, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series: purchaseIds.map((id, i) => ({
                name: labelById.get(id),
                type: 'bar',
                stack: 'total',
                itemStyle: { color: this.chartTheme.colorAt(i) },
                data: months.map(m => m.purchases.find(p => p.cardTransactionId === id)?.amount ?? 0),
            })),
        } as EChartsOption;
    }

    // Cronograma: gantt horizontal armado con el truco estándar de ECharts (barra invisible de
    // offset + barra visible de duración, ambas apiladas) — no hay tipo de serie "gantt" nativo.
    private renderGantt(): void {
        const timeline = [...this.data!.timeline].sort((a, b) => a.startMonth.localeCompare(b.startMonth));
        const months = this.data!.monthlySeries.map(m => m.month.substring(0, 7));
        const monthLabels = this.data!.monthlySeries.map(m => new Date(m.month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        const indexOf = (month: string) => Math.max(0, months.indexOf(month.substring(0, 7)));
        const rows = timeline.map(t => ({
            label: `${t.detail} (${t.cardName})`,
            start: indexOf(t.startMonth),
            duration: indexOf(t.endMonth) - indexOf(t.startMonth) + 1,
            amount: t.installmentAmount,
        }));

        this.ganttOptions = {
            grid: { left: 200, right: 30, top: 20, bottom: 40 },
            tooltip: {
                trigger: 'item',
                ...this.chartTheme.tooltipDefaults(),
                formatter: (p: any) => (p.seriesName === 'duración' ? `${rows[p.dataIndex].label}: ${fmt(rows[p.dataIndex].amount)}/mes` : ''),
            },
            xAxis: {
                type: 'value',
                min: 0,
                max: months.length,
                interval: 1,
                axisLabel: { color: axisLabel, formatter: (v: number) => monthLabels[Math.round(v)] ?? '' },
                splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } },
            },
            yAxis: { type: 'category', data: rows.map(r => r.label), axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            series: [
                { name: 'offset', type: 'bar', stack: 'gantt', silent: true, itemStyle: { color: 'transparent' }, data: rows.map(r => r.start) },
                { name: 'duración', type: 'bar', stack: 'gantt', data: rows.map(r => r.duration), itemStyle: { color: (p: any) => this.chartTheme.colorAt(p.dataIndex) } },
            ],
        } as EChartsOption;
    }

    get ganttHeight(): number {
        return Math.max(200, (this.data?.timeline.length ?? 0) * 40);
    }
}
