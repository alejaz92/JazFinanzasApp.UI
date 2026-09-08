import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import type { EChartsOption } from 'echarts';

import { UserService } from '../../user/services/user.service';
import { AssetService } from '../../asset/services/asset.service';
import { DashboardService } from '../../report/services/dashboard.service';
import { Dashboard, DashboardPendingItem } from '../../report/models/dashboard.model';
import { NetWorthService } from '../../report/services/net-worth.service';
import { NetWorthMonthlyPoint } from '../../report/models/net-worth.model';
import { pendingIcon, pendingAction, pendingRoute, pendingLabel, pendingBadgeClass, pendingIconClass } from '../../report/utils/dashboard-pending.util';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { ToastService } from '../../../core/services/toast.service';

// Ocultar montos (pedido del usuario tras ver la Fase 18): Inicio se ve sin ningún clic de por
// medio al abrir la app, a diferencia de Reportes donde entrar ya es una decisión — mismo patrón
// que las apps bancarias, un ícono de ojo que enmascara los números. Preferencia por dispositivo,
// no por usuario: no hace falta backend.
const HIDE_AMOUNTS_STORAGE_KEY = 'jaz-hide-amounts';
const AMOUNT_MASK = '••••';

// Inicio (Fase 18, sección 5 del plan, versión "Mínimo" tras la comparación en vivo de 3
// variantes): saludo y acciones rápidas, indicadores, bandeja de pendientes y patrimonio (línea +
// composición) — sin selector de moneda ni de período (principio 5: "Inicio responde por hoy... no
// se filtra ni se configura"), así que usa siempre la moneda de referencia principal del usuario.
// "Mis cuentas" y "Actividad reciente" (5.5/5.6) se sacaron: ya están a un clic (Patrimonio → Por
// cuenta, Movimientos) y hacían que la pantalla no entrara en un solo scroll.
@Component({
    selector: 'app-home',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, NgClass, RouterLink, DatePipe, ChartComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
    private readonly userService = inject(UserService);
    private readonly assetService = inject(AssetService);
    private readonly dashboardService = inject(DashboardService);
    private readonly netWorthService = inject(NetWorthService);
    private readonly chartTheme = inject(ChartThemeService);
    private readonly toastService = inject(ToastService);
    private readonly currencyPipe = new CurrencyFiatFormatPipe();

    isLoading = true;
    userName = '';
    amountsHidden = false;

    // Sin movimientos cargados (5.8): en vez del resto de la pantalla, se muestra la guía de 3 pasos.
    isFirstUse = false;

    indicators: Dashboard['indicators'] | null = null;
    pending: DashboardPendingItem[] = [];
    monthly: NetWorthMonthlyPoint[] = [];

    netWorthLineOptions: EChartsOption = {};
    compositionOptions: EChartsOption = {};

    protected readonly pendingIcon = pendingIcon;
    protected readonly pendingAction = pendingAction;
    protected readonly pendingRoute = pendingRoute;
    protected readonly pendingLabel = pendingLabel;
    protected readonly pendingBadgeClass = pendingBadgeClass;
    protected readonly pendingIconClass = pendingIconClass;

    ngOnInit(): void {
        try {
            this.amountsHidden = localStorage.getItem(HIDE_AMOUNTS_STORAGE_KEY) === 'true';
        } catch {
            // localStorage puede no estar disponible (navegación privada) — se queda visible.
        }

        this.userService.getUserData().subscribe(user => this.userName = user.name);

        this.assetService.getReferenceAssets().subscribe({
            next: assets => {
                const main = assets.find(a => a.isMainReference) ?? assets[0];
                if (main) this.load(main.id);
                else this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
                this.toastService.error('Error al cargar los datos de Inicio');
            }
        });
    }

    private load(assetId: number): void {
        forkJoin({
            dashboard: this.dashboardService.getDashboard(assetId),
            monthly: this.netWorthService.getMonthlySeries(assetId),
            accounts: this.netWorthService.getByAccount(assetId)
        }).subscribe({
            next: ({ dashboard, monthly, accounts }) => {
                this.indicators = dashboard.indicators;
                this.pending = dashboard.pending;
                this.monthly = monthly;
                // GetAccountBalancesAsync (backend) solo trae cuentas con al menos un movimiento — sin
                // ninguna, no hay nada que mostrar en el resto de la pantalla (5.8).
                this.isFirstUse = accounts.length === 0;
                this.isLoading = false;
                if (!this.isFirstUse) setTimeout(() => this.renderCharts(), 0);
            },
            error: () => {
                this.isLoading = false;
                this.toastService.error('Error al cargar los datos de Inicio');
            }
        });
    }

    toggleAmountsHidden(): void {
        this.amountsHidden = !this.amountsHidden;
        try {
            localStorage.setItem(HIDE_AMOUNTS_STORAGE_KEY, String(this.amountsHidden));
        } catch {
            // Sin localStorage la preferencia simplemente no persiste entre recargas.
        }
        this.renderCharts();
    }

    // Único punto por el que pasa cada monto de la pantalla — así ocultar es no perderse ninguno.
    fmt(value: number): string {
        return this.amountsHidden ? AMOUNT_MASK : this.currencyPipe.transform(value);
    }

    private renderCharts(): void {
        if (this.monthly.length === 0) return;
        this.renderNetWorthLine();
        this.renderComposition();
    }

    private renderNetWorthLine(): void {
        const labels = this.monthly.map(m => new Date(m.month).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }));
        const axisLabel = this.chartTheme.surface.axisLabel;
        const fmt = (v: number) => this.amountsHidden ? AMOUNT_MASK : this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

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
        const fmt = (v: number) => this.amountsHidden ? AMOUNT_MASK : this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });

        this.compositionOptions = {
            ...this.chartTheme.pieOptions(labels, values, { donut: true, showLegend: true, formatValue: fmt }),
            title: {
                text: fmt(last.total),
                left: 'center', top: 'center',
                textStyle: { fontSize: 16, fontWeight: 'bold', color: this.chartTheme.surface.axisLabel },
            },
        } as EChartsOption;
    }

    get today(): string {
        const d = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
        return d.charAt(0).toUpperCase() + d.slice(1);
    }

    get netWorthChangeIsPositive(): boolean {
        return (this.indicators?.netWorthChangeVsPreviousMonth ?? 0) >= 0;
    }

    get monthResultIsPositive(): boolean {
        return (this.indicators?.monthResult ?? 0) >= 0;
    }
}
