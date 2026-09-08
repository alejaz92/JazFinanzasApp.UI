import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import type { EChartsOption } from 'echarts';

import { DashboardService } from '../services/dashboard.service';
import { Dashboard, DashboardPendingItem } from '../models/dashboard.model';
import { NetWorthService } from '../services/net-worth.service';
import { NetWorthTotal, NetWorthMonthlyPoint } from '../models/net-worth.model';
import { IncomeExpenseService } from '../services/income-expense.service';
import { IncExpEvolutionPoint } from '../models/income-expense.model';
import { pendingIcon, pendingAction, pendingRoute, pendingLabel } from '../utils/dashboard-pending.util';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { ContrastTextPipe } from '../../../shared/pipes/contrastText/contrast-text.pipe';

// Panorama (Fase 17, Flujo 1 del plan): pantalla de entrada de Reportes. Compone tres fuentes que
// ya existen, sin recalcular nada: DashboardService (Fase 16 — indicadores, termómetro, pendientes),
// NetWorthService (la valoración total multi-moneda de "Saldos"/Patrimonio → General, D-9, más la
// serie mensual para la línea y el anillo) e IncomeExpenseService.getEvolution (el promedio móvil de
// 6 meses ya calculado por Ingresos y Egresos → Evolución, D-A — reutilizado acá para "gasto del mes
// contra el promedio" en vez de duplicar ese cálculo).

@Component({
    selector: 'app-panorama',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, NgClass, RouterLink, DatePipe, CurrencyFiatFormatPipe, ContrastTextPipe, ChartComponent],
    templateUrl: './panorama.component.html',
    styleUrl: './panorama.component.css'
})
export class PanoramaComponent {
    private readonly dashboardService = inject(DashboardService);
    private readonly netWorthService = inject(NetWorthService);
    private readonly incomeExpenseService = inject(IncomeExpenseService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    // La valoración total de arriba de todo no depende de la moneda elegida (D-9: "en cada moneda de
    // referencia" — todas a la vez, como "Saldos") — se carga una sola vez.
    isLoadingTotals = true;
    totals: NetWorthTotal[] = [];

    isLoadingDashboard = false;
    dashboardRequested = false;
    indicators: Dashboard['indicators'] | null = null;
    thermometer: Dashboard['thermometer'] | null = null;
    pending: DashboardPendingItem[] = [];
    monthly: NetWorthMonthlyPoint[] = [];
    lastEvolutionPoint: IncExpEvolutionPoint | null = null;

    netWorthLineOptions: EChartsOption = {};
    compositionOptions: EChartsOption = {};

    constructor() {
        effect(() => {
            const assetId = this.reportContext.currencyAssetId();
            if (assetId != null) this.loadForCurrency(assetId);
        });

        this.netWorthService.getGeneral().subscribe(data => {
            this.totals = data.totals;
            this.isLoadingTotals = false;
        });
    }

    private loadForCurrency(assetId: number): void {
        this.isLoadingDashboard = true;
        this.dashboardRequested = true;

        forkJoin({
            dashboard: this.dashboardService.getDashboard(assetId),
            monthly: this.netWorthService.getMonthlySeries(assetId),
            evolution: this.incomeExpenseService.getEvolution(assetId, 6)
        }).subscribe(({ dashboard, monthly, evolution }) => {
            this.indicators = dashboard.indicators;
            this.thermometer = dashboard.thermometer;
            this.pending = dashboard.pending;
            this.monthly = monthly;
            this.lastEvolutionPoint = evolution.length > 0 ? evolution[evolution.length - 1] : null;
            this.isLoadingDashboard = false;
            setTimeout(() => this.renderCharts(), 0);
        });
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
        return (this.indicators?.netWorthChangeVsPreviousMonth ?? 0) >= 0;
    }

    get monthResultIsPositive(): boolean {
        return (this.indicators?.monthResult ?? 0) >= 0;
    }

    get thermometerPct(): number {
        if (!this.thermometer || this.thermometer.projectedMonthEndAmount <= 0) return 0;
        return Math.min(100, (this.thermometer.monthToDateAmount / this.thermometer.projectedMonthEndAmount) * 100);
    }

    get lastExpenseMovingAverage(): number | null {
        return this.lastEvolutionPoint?.expenseMovingAverage ?? null;
    }

    protected readonly pendingIcon = pendingIcon;
    protected readonly pendingAction = pendingAction;
    protected readonly pendingRoute = pendingRoute;
    protected readonly pendingLabel = pendingLabel;
}
