import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor, NgClass, NgTemplateOutlet, NgSwitch, NgSwitchCase, NgSwitchDefault, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { EChartsOption } from 'echarts';

import { DashboardService } from '../services/dashboard.service';
import { BlockState, DashboardCommitments, DashboardMonth, DashboardNetWorth, DashboardPendingItem } from '../models/dashboard.model';
import { NetWorthTotal, NetWorthMonthlyPoint } from '../models/net-worth.model';
import { pendingIcon, pendingAction, pendingRoute, pendingBadgeClass, pendingIconClass } from '../utils/dashboard-pending.util';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { ContrastTextPipe } from '../../../shared/pipes/contrastText/contrast-text.pipe';
import { InfoButtonComponent } from '../../../shared/components/info-button/info-button.component';

// Panorama (Fase 17, Flujo 1 del plan): pantalla de entrada de Reportes. Compone fuentes que ya
// existen, sin recalcular nada: DashboardService (Fase 16 — indicadores, termómetro, pendientes) y la
// valoración total multi-moneda de "Saldos"/Patrimonio → General (D-9) más la serie mensual para la
// línea y el anillo. Desde plan-devoluciones-llm-v2.md (Fase 4) el gasto del mes y su promedio también
// vienen del dashboard, medidos por fecha de compra, igual que el termómetro.
//
// plan-inicio-rapido.md, Fase 6: igual que Inicio, el resumen ya no se pide entero. Cuatro bloques (patrimonio, mes, compromisos y
// pendientes) se piden a la vez y cada uno se dibuja apenas llega, con su propio estado de carga y su propio "Reintentar" (D8). Patrimonio y
// mes dependen de la moneda elegida arriba (se vuelven a pedir al cambiarla); compromisos y pendientes no, así que se piden una sola vez.
// El bloque de patrimonio trae también los totales por moneda de referencia (antes `General`) y la serie mensual (antes `Monthly`).

@Component({
    selector: 'app-panorama',
    standalone: true,
    imports: [NgIf, NgFor, NgClass, NgTemplateOutlet, NgSwitch, NgSwitchCase, NgSwitchDefault, RouterLink, DatePipe, CurrencyFiatFormatPipe, ContrastTextPipe, ChartComponent, InfoButtonComponent],
    templateUrl: './panorama.component.html',
    styleUrl: './panorama.component.css'
})
export class PanoramaComponent {
    private readonly dashboardService = inject(DashboardService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    // Un estado por bloque: cada uno se dibuja, falla y se reintenta por su cuenta.
    netWorthState: BlockState = 'loading';
    monthState: BlockState = 'loading';
    commitmentsState: BlockState = 'loading';
    pendingState: BlockState = 'loading';

    netWorth: DashboardNetWorth | null = null;
    month: DashboardMonth | null = null;
    commitments: DashboardCommitments | null = null;
    pending: DashboardPendingItem[] = [];

    netWorthLineOptions: EChartsOption = {};
    compositionOptions: EChartsOption = {};

    constructor() {
        // Compromisos y pendientes no dependen de la moneda elegida: salen ya, una sola vez.
        this.loadCommitments();
        this.loadPending();

        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) {
                this.loadNetWorth(assetId);
                this.loadMonth(assetId);
            }
        });
    }

    // ── Carga por bloque ────────────────────────────────────────────────────────────────────

    // Si el usuario cambia de moneda mientras un pedido está en vuelo, la respuesta de la moneda anterior se descarta.
    private isCurrent(assetId: number): boolean {
        return this.reportContext.currencyAssetId() === assetId;
    }

    retryNetWorth = (): void => this.withCurrency(id => this.loadNetWorth(id));
    retryMonth = (): void => this.withCurrency(id => this.loadMonth(id));
    retryCommitments = (): void => this.loadCommitments();
    retryPending = (): void => this.loadPending();

    private withCurrency(load: (assetId: number) => void): void {
        const assetId = this.reportContext.currencyAssetId();
        if (assetId != null) load(assetId);
    }

    private loadNetWorth(assetId: number): void {
        this.netWorthState = 'loading';
        this.dashboardService.getNetWorth(assetId).subscribe({
            next: data => {
                if (!this.isCurrent(assetId)) return;
                this.netWorth = data;
                this.netWorthState = 'ready';
                setTimeout(() => this.renderCharts(), 0);
            },
            error: () => { if (this.isCurrent(assetId)) this.netWorthState = 'error'; }
        });
    }

    private loadMonth(assetId: number): void {
        this.monthState = 'loading';
        this.dashboardService.getMonth(assetId).subscribe({
            next: data => {
                if (!this.isCurrent(assetId)) return;
                this.month = data;
                this.monthState = 'ready';
            },
            error: () => { if (this.isCurrent(assetId)) this.monthState = 'error'; }
        });
    }

    private loadCommitments(): void {
        this.commitmentsState = 'loading';
        this.dashboardService.getCommitments().subscribe({
            next: data => {
                this.commitments = data;
                this.commitmentsState = 'ready';
            },
            error: () => this.commitmentsState = 'error'
        });
    }

    private loadPending(): void {
        this.pendingState = 'loading';
        this.dashboardService.getPending().subscribe({
            next: items => {
                this.pending = items;
                this.pendingState = 'ready';
            },
            error: () => this.pendingState = 'error'
        });
    }

    // ── Estado derivado ─────────────────────────────────────────────────────────────────────

    // Todavía no se eligió una moneda arriba: no hay nada que pedir de patrimonio ni de mes.
    get currencyChosen(): boolean {
        return this.reportContext.currencyAssetId() != null;
    }

    // La valoración total de arriba de todo no depende de la moneda elegida (D-9: "en cada moneda de referencia" — todas a la vez, como
    // "Saldos"): sale del bloque de patrimonio.
    get totals(): NetWorthTotal[] {
        return this.netWorth?.totals ?? [];
    }

    get monthly(): NetWorthMonthlyPoint[] {
        return this.netWorth?.monthly ?? [];
    }

    private renderCharts(): void {
        if (this.monthly.length === 0) return;
        this.renderNetWorthLine();
        this.renderComposition();
    }

    private renderNetWorthLine(): void {
        const labels = this.monthly.map(m => new Date(m.month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        this.netWorthLineOptions = {
            color: [this.chartTheme.colorAt(0)],
            grid: { left: 70, right: 20, top: 20, bottom: 40 },
            tooltip: { trigger: 'axis', ...this.chartTheme.tooltipDefaults(), valueFormatter: (v: unknown) => fmt(Number(v)) },
            xAxis: { type: 'category', data: labels, axisLabel: { color: axisLabel }, axisLine: { lineStyle: { color: this.chartTheme.surface.axisLine } } },
            yAxis: { type: 'value', axisLabel: { color: axisLabel, formatter: (v: number) => fmt(v) }, splitLine: { lineStyle: { color: this.chartTheme.surface.splitLine } } },
            series: [{
                type: 'line', showSymbol: false, areaStyle: { opacity: 0.15 },
                data: this.monthly.map(m => m.total),
                itemStyle: { color: this.chartTheme.colorAt(0) },
            }],
        } as EChartsOption;
    }

    private renderComposition(): void {
        const last = this.monthly[this.monthly.length - 1];
        const labels = ['Dinero', 'Bolsa R. Variable', 'Cripto Volátil', 'Cripto Estable', 'Bolsa R. Fija'];
        const values = [last.accounts, last.stocks, last.cryptoVolatile, last.cryptoStable, last.bonds];
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        this.compositionOptions = {
            ...this.chartTheme.pieOptions(labels, values, { donut: true, showLegend: true, formatValue: fmt }),
            // Total en el centro de la dona (sección 6, Flujo 1) — con radius ['45%','70%'] el hueco
            // queda en el centro del gráfico, así que un título posicionado ahí cae adentro.
            title: {
                text: fmt(last.total),
                left: 'center', top: 'center',
                textStyle: { fontSize: 16, fontWeight: 'bold', color: this.chartTheme.surface.axisLabel },
            },
        } as EChartsOption;
    }

    get netWorthChangeIsPositive(): boolean {
        return (this.netWorth?.netWorthChangeVsPreviousMonth ?? 0) >= 0;
    }

    get monthResultIsPositive(): boolean {
        return (this.month?.monthResult ?? 0) >= 0;
    }

    get thermometerPct(): number {
        const thermometer = this.month?.thermometer;
        if (!thermometer || thermometer.projectedMonthEndAmount <= 0) return 0;
        return Math.min(100, (thermometer.monthToDateAmount / thermometer.projectedMonthEndAmount) * 100);
    }

    protected readonly pendingIcon = pendingIcon;
    protected readonly pendingAction = pendingAction;
    protected readonly pendingRoute = pendingRoute;
    protected readonly pendingBadgeClass = pendingBadgeClass;
    protected readonly pendingIconClass = pendingIconClass;

}
