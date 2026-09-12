import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { EChartsOption } from 'echarts';

import { SharedEventReportService } from '../services/shared-event-report.service';
import { SharedEventGeneralReport, SharedEventBalancePoint } from '../models/shared-event-report.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';

interface PersonNet {
    personId: number;
    personName: string;
    net: number;
}

interface AssetEvolution {
    assetId: number;
    assetSymbol: string;
    options: EChartsOption;
}

// Compartidos — General (Fase 22, Flujo 7): con quién comparto y cómo estoy. Balances reusa íntegro
// SharedEventReportService.GetGeneralAsync/GetConsolidatedDebtsAsync (backend, Fase 21) — no se
// convierte a una sola moneda, cada saldo se agrupa y grafica por su propia moneda (ver comentario
// del modelo). Sin selector de moneda en la barra (hideCurrencyFilter, ver report.routes.ts).
@Component({
    selector: 'app-shared-events-general-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, DecimalPipe, RouterLink, ChartComponent],
    templateUrl: './shared-events-general-report.component.html',
    styleUrl: './shared-events-general-report.component.css'
})
export class SharedEventsGeneralReportComponent implements OnInit {
    private readonly sharedEventReportService = inject(SharedEventReportService);
    private readonly chartTheme = inject(ChartThemeService);

    protected readonly Math = Math;

    isLoading = true;
    data: SharedEventGeneralReport | null = null;
    personNets: PersonNet[] = [];
    assetEvolutions: AssetEvolution[] = [];

    balancesByPersonOptions: EChartsOption = {};
    eventRankingOptions: EChartsOption = {};

    ngOnInit(): void {
        this.isLoading = true;
        this.sharedEventReportService.getGeneral().subscribe(data => {
            this.data = data;
            this.personNets = this.computePersonNets(data);
            this.isLoading = false;
            setTimeout(() => this.renderCharts(data), 0);
        });
    }

    // Un saldo puede venir repartido en más de una moneda para la misma persona; se suma nominal
    // para poder mostrar una sola barra por persona (mismo criterio y misma advertencia que el
    // ranking de eventos del backend — en la práctica, hoy todo Compartidos es una sola moneda).
    private computePersonNets(data: SharedEventGeneralReport): PersonNet[] {
        const map = new Map<number, PersonNet>();
        for (const b of data.balances) {
            const existing = map.get(b.personId);
            const net = b.pendingInFavor - b.pendingAgainst;
            if (existing) existing.net += net;
            else map.set(b.personId, { personId: b.personId, personName: b.personName, net });
        }
        return Array.from(map.values()).sort((a, b) => b.net - a.net);
    }

    private renderCharts(data: SharedEventGeneralReport): void {
        this.renderBalancesByPerson();
        this.renderEvolutions(data.balanceEvolution);
        this.renderRanking(data);
    }

    private renderBalancesByPerson(): void {
        if (this.personNets.length === 0) {
            this.balancesByPersonOptions = {};
            return;
        }
        this.balancesByPersonOptions = this.chartTheme.divergingBarOptions(
            this.personNets.map(p => p.personName),
            this.personNets.map(p => p.net),
            { formatValue: v => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 }) }
        );
    }

    private renderEvolutions(points: SharedEventBalancePoint[]): void {
        const byAsset = new Map<number, { assetSymbol: string; points: SharedEventBalancePoint[] }>();
        for (const p of points) {
            const entry = byAsset.get(p.assetId);
            if (entry) entry.points.push(p);
            else byAsset.set(p.assetId, { assetSymbol: p.assetSymbol, points: [p] });
        }

        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        this.assetEvolutions = Array.from(byAsset.entries()).map(([assetId, { assetSymbol, points }]) => {
            const labels = points.map(p => new Date(p.month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));
            const values = points.map(p => p.myBalance);
            return { assetId, assetSymbol, options: this.chartTheme.lineOptions(labels, values, { formatValue: fmt, colorIndex: 6 }) };
        });
    }

    private renderRanking(data: SharedEventGeneralReport): void {
        if (data.eventRanking.length === 0) {
            this.eventRankingOptions = {};
            return;
        }
        const names = data.eventRanking.map(e => e.eventName);
        // Ranking nominal (mismo criterio que el backend): suma entre monedas si un evento las mezcla.
        const values = data.eventRanking.map(e => e.amounts.reduce((sum, a) => sum + a.total, 0));
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        const axisLabel = this.chartTheme.surface.axisLabel;
        const leftMargin = Math.min(200, Math.max(120, Math.max(...names.map(n => n.length)) * 7));

        this.eventRankingOptions = {
            grid: { left: leftMargin, right: 30, top: 20, bottom: 30 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            yAxis: { type: 'category', data: names, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            series: [{ type: 'bar', data: values, itemStyle: { color: (p: any) => this.chartTheme.colorAt(p.dataIndex) } }],
        } as EChartsOption;
    }
}
