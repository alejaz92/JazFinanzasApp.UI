import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor, DecimalPipe, DatePipe } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { SharedEventReportService } from '../services/shared-event-report.service';
import { SharedEventPersonReport } from '../models/shared-event-report.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { InfoButtonComponent } from '../../../shared/components/info-button/info-button.component';

interface HistoryItem {
    date: string;
    eventName: string;
    kind: 'Movimiento' | 'Pago';
    description: string;
    amount: number;
    assetSymbol: string;
}

// Compartidos — Por persona (Fase 22, Flujo 7): cómo viene mi historia con esta persona. El selector
// de persona vive en la barra de filtros compartida (personFilter: 'required'), mismo criterio que
// "Por tarjeta"/"Carteras — Detalle". Sin selector de moneda (hideCurrencyFilter): cada saldo se
// muestra en la suya, ver el comentario de SharedEventReportDTOs en el backend.
//
// Hubo un gráfico de evolución del saldo (BalanceEvolution), sacado tras la revisión de la Fase 22:
// contradecía a la tabla de "Saldo actual" de esta misma pantalla porque solo podía reconstruirse a
// partir de Eventos, y la mayoría del saldo real de una persona viene del pool de gastos compartidos
// sueltos (sin Evento) — ver el comentario en SharedEventReportService (backend).
@Component({
    selector: 'app-shared-events-by-person-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, DecimalPipe, DatePipe, ChartComponent, InfoButtonComponent],
    templateUrl: './shared-events-by-person-report.component.html',
    styleUrl: './shared-events-by-person-report.component.css'
})
export class SharedEventsByPersonReportComponent {
    private readonly sharedEventReportService = inject(SharedEventReportService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    isLoading = true;
    data: SharedEventPersonReport | null = null;
    history: HistoryItem[] = [];

    categoryTotalsOptions: EChartsOption = {};

    constructor() {
        effect(() => {
            const personId = this.reportContext.selectedPersonId();
            if (personId != null) this.load(personId);
        });
    }

    private load(personId: number): void {
        this.isLoading = true;
        this.sharedEventReportService.getByPerson(personId).subscribe(data => {
            this.data = data;
            this.history = this.buildHistory(data);
            this.isLoading = false;
            setTimeout(() => this.renderCategoryTotals(data), 0);
        });
    }

    private buildHistory(data: SharedEventPersonReport): HistoryItem[] {
        const movements: HistoryItem[] = data.movements.map(m => ({
            date: m.movement.date,
            eventName: m.eventName,
            kind: 'Movimiento',
            description: m.movement.description,
            amount: m.movement.shares.find(s => s.personId === data.personId)?.amount ?? m.movement.totalAmount,
            assetSymbol: m.movement.assetSymbol,
        }));
        const payments: HistoryItem[] = data.payments.map(p => ({
            date: p.payment.date,
            eventName: p.eventName,
            kind: 'Pago',
            description: p.payment.fromPersonId === data.personId ? 'Pagó' : 'Recibió pago',
            amount: p.payment.amount,
            assetSymbol: p.payment.assetSymbol,
        }));
        return [...movements, ...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    private renderCategoryTotals(data: SharedEventPersonReport): void {
        if (data.categoryTotals.length === 0) {
            this.categoryTotalsOptions = {};
            return;
        }
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        this.categoryTotalsOptions = this.chartTheme.pieOptions(
            data.categoryTotals.map(c => c.transactionClassName),
            data.categoryTotals.map(c => c.total),
            { donut: true, showLegend: true, formatValue: fmt }
        );
    }
}
