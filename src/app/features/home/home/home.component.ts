import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, NgClass, NgTemplateOutlet, NgSwitch, NgSwitchCase, NgSwitchDefault, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { EChartsOption } from 'echarts';

import { UserService } from '../../user/services/user.service';
import { AssetService } from '../../asset/services/asset.service';
import { DashboardService } from '../../report/services/dashboard.service';
import { BlockState, DashboardCommitments, DashboardMonth, DashboardNetWorth, DashboardPendingItem } from '../../report/models/dashboard.model';
import { NetWorthMonthlyPoint } from '../../report/models/net-worth.model';
import { pendingIcon, pendingAction, pendingRoute, pendingBadgeClass, pendingIconClass, pendingSummary, pendingSeverityBadgeClass } from '../../report/utils/dashboard-pending.util';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { AssistantCardComponent } from '../../assistant/components/assistant-card/assistant-card.component';
import { maskMoney } from '../../assistant/utils/assistant.util';

// Ocultar montos (pedido del usuario tras ver la Fase 18): Inicio se ve sin ningún clic de por
// medio al abrir la app, a diferencia de Reportes donde entrar ya es una decisión — mismo patrón
// que las apps bancarias, un ícono de ojo que enmascara los números. Preferencia por dispositivo,
// no por usuario: no hace falta backend.
const HIDE_AMOUNTS_STORAGE_KEY = 'jaz-hide-amounts';
const AMOUNT_MASK = '••••';

// La bandeja "Requiere tu atención" va plegada por defecto (plan-inicio-rapido.md, D9) y se recuerda si el usuario la abrió.
const PENDING_OPEN_STORAGE_KEY = 'jaz-home-pending-open';

// Inicio (Fase 18, sección 5 del plan, versión "Mínimo" tras la comparación en vivo de 3
// variantes): saludo y acciones rápidas, indicadores, bandeja de pendientes y patrimonio (línea +
// composición) — sin selector de moneda ni de período (principio 5: "Inicio responde por hoy... no
// se filtra ni se configura"), así que usa siempre la moneda de referencia principal del usuario.
// "Mis cuentas" y "Actividad reciente" (5.5/5.6) se sacaron: ya están a un clic (Patrimonio → Por
// cuenta, Movimientos) y hacían que la pantalla no entrara en un solo scroll.
//
// plan-inicio-rapido.md, Fase 5: el resumen ya no se pide entero. Cuatro bloques (patrimonio, mes, compromisos y pendientes)
// se piden a la vez y cada uno se dibuja apenas llega, con su propio estado de carga y su propio "Reintentar" si falla (D8).
@Component({
    selector: 'app-home',
    standalone: true,
    imports: [NgIf, NgFor, NgClass, NgTemplateOutlet, NgSwitch, NgSwitchCase, NgSwitchDefault, RouterLink, DatePipe, ChartComponent, AssistantCardComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
    private readonly userService = inject(UserService);
    private readonly assetService = inject(AssetService);
    private readonly dashboardService = inject(DashboardService);
    private readonly chartTheme = inject(ChartThemeService);
    private readonly currencyPipe = new CurrencyFiatFormatPipe();

    userName = '';
    amountsHidden = false;

    // Un estado por bloque: cada uno se dibuja, falla y se reintenta por su cuenta.
    netWorthState: BlockState = 'loading';
    monthState: BlockState = 'loading';
    commitmentsState: BlockState = 'loading';
    pendingState: BlockState = 'loading';

    netWorth: DashboardNetWorth | null = null;
    month: DashboardMonth | null = null;
    commitments: DashboardCommitments | null = null;
    pending: DashboardPendingItem[] = [];
    pendingOpen = false;

    private referenceAssetId: number | null = null;

    netWorthLineOptions: EChartsOption = {};
    compositionOptions: EChartsOption = {};

    protected readonly pendingIcon = pendingIcon;
    protected readonly pendingAction = pendingAction;
    protected readonly pendingRoute = pendingRoute;
    protected readonly pendingBadgeClass = pendingBadgeClass;
    protected readonly pendingIconClass = pendingIconClass;

    // El título y el detalle de un aviso pueden traer montos escritos (una alerta del asistente): con el
    // ojo de "ocultar montos" cerrado se enmascaran igual que el resto de los números de la pantalla.
    protected shown(text: string | null): string {
        return this.amountsHidden ? maskMoney(text) : (text ?? '');
    }

    ngOnInit(): void {
        try {
            this.amountsHidden = localStorage.getItem(HIDE_AMOUNTS_STORAGE_KEY) === 'true';
            this.pendingOpen = localStorage.getItem(PENDING_OPEN_STORAGE_KEY) === 'true';
        } catch {
            // localStorage puede no estar disponible (navegación privada) — todo se queda como el default.
        }

        this.userService.getUserData().subscribe(user => this.userName = user.name);

        // Compromisos y pendientes no dependen de la moneda de referencia: salen ya, sin esperar a saber cuál es.
        this.loadCommitments();
        this.loadPending();
        this.loadReferenceAssetThen(() => { this.loadNetWorth(); this.loadMonth(); });
    }

    // ── Carga por bloque ────────────────────────────────────────────────────────────────────

    // Patrimonio y mes dependen de la moneda de referencia principal; se averigua una sola vez y se reutiliza al reintentar.
    private loadReferenceAssetThen(load: () => void): void {
        if (this.referenceAssetId != null) {
            load();
            return;
        }

        this.netWorthState = 'loading';
        this.monthState = 'loading';
        this.assetService.getReferenceAssets().subscribe({
            next: assets => {
                const main = assets.find(a => a.isMainReference) ?? assets[0];
                if (!main) {
                    // Sin moneda de referencia no hay nada que calcular: se dibuja lo que haya, sin patrimonio ni mes.
                    this.netWorthState = 'ready';
                    this.monthState = 'ready';
                    return;
                }
                this.referenceAssetId = main.id;
                load();
            },
            error: () => {
                this.netWorthState = 'error';
                this.monthState = 'error';
            }
        });
    }

    retryNetWorth = (): void => this.loadReferenceAssetThen(() => this.loadNetWorth());
    retryMonth = (): void => this.loadReferenceAssetThen(() => this.loadMonth());
    retryCommitments = (): void => this.loadCommitments();
    retryPending = (): void => this.loadPending();

    private loadNetWorth(): void {
        this.netWorthState = 'loading';
        this.dashboardService.getNetWorth(this.referenceAssetId!).subscribe({
            next: data => {
                this.netWorth = data;
                this.netWorthState = 'ready';
                // GetAccountBalancesAsync (backend) solo trae cuentas con al menos un movimiento — sin
                // ninguna, no hay nada que mostrar en el resto de la pantalla (5.8).
                if (data.hasAccounts) setTimeout(() => this.renderCharts(), 0);
            },
            error: () => this.netWorthState = 'error'
        });
    }

    private loadMonth(): void {
        this.monthState = 'loading';
        this.dashboardService.getMonth(this.referenceAssetId!).subscribe({
            next: data => {
                this.month = data;
                this.monthState = 'ready';
            },
            error: () => this.monthState = 'error'
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

    // 5.8 Primer uso: solo se sabe cuando llegó el patrimonio. Hasta entonces (y si falla) se dibujan los bloques normales.
    get isFirstUse(): boolean {
        return this.netWorthState === 'ready' && this.netWorth != null && !this.netWorth.hasAccounts;
    }

    get monthly(): NetWorthMonthlyPoint[] {
        return this.netWorth?.monthly ?? [];
    }

    // Bandeja plegable (D9): el encabezado resume cuántos avisos hay y la gravedad más alta.
    get pendingCount(): number {
        return pendingSummary(this.pending).count;
    }

    get pendingSummaryBadgeClass(): string {
        return pendingSeverityBadgeClass(pendingSummary(this.pending).severity);
    }

    get canTogglePending(): boolean {
        return this.pendingState === 'ready' && this.pending.length > 0;
    }

    togglePending(): void {
        if (!this.canTogglePending) return;
        this.pendingOpen = !this.pendingOpen;
        try {
            localStorage.setItem(PENDING_OPEN_STORAGE_KEY, String(this.pendingOpen));
        } catch {
            // Sin localStorage la preferencia simplemente no persiste entre recargas.
        }
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
        return (this.netWorth?.netWorthChangeVsPreviousMonth ?? 0) >= 0;
    }

    get monthResultIsPositive(): boolean {
        return (this.month?.monthResult ?? 0) >= 0;
    }
}
