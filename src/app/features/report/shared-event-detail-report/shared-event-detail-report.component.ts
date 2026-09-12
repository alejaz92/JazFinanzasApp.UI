import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor, DecimalPipe, DatePipe } from '@angular/common';
import type { EChartsOption } from 'echarts';

import { SharedEventService } from '../../shared-events/services/shared-event.service';
import { SharedEventDetail } from '../../shared-events/models/shared-event.model';
import { ReportContextService } from '../../../shared/services/report-context.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';

// Compartidos — Por evento (Fase 22, Flujo 7): quién puso qué, cómo se repartió, qué quedó
// pendiente. No hay nada nuevo que pedirle al backend (Fase 21) — SharedEventService.GetByIdAsync ya
// devuelve Balances/CategoryTotals/Movements/Payments, que es exactamente esa pregunta; esta
// pantalla reusa el mismo servicio y modelo que la ficha de gestión del evento (`/shared-events/:id`)
// pero en versión de reporte: solo lectura, con los dos gráficos que esa ficha no tiene, y el
// selector de evento en la barra de filtros compartida (eventFilter: 'required') en vez de navegar
// por ruta.
@Component({
    selector: 'app-shared-event-detail-report',
    standalone: true,
    imports: [LoadingComponent, NgIf, NgFor, DecimalPipe, DatePipe, ChartComponent],
    templateUrl: './shared-event-detail-report.component.html',
    styleUrl: './shared-event-detail-report.component.css'
})
export class SharedEventDetailReportComponent {
    private readonly sharedEventService = inject(SharedEventService);
    private readonly chartTheme = inject(ChartThemeService);
    protected readonly reportContext = inject(ReportContextService);

    protected readonly Math = Math;

    isLoading = true;
    event: SharedEventDetail | null = null;

    contributedOptions: EChartsOption = {};
    categoryOptions: EChartsOption = {};

    constructor() {
        effect(() => {
            const eventId = this.reportContext.selectedEventId();
            if (eventId != null) this.load(eventId);
        });
    }

    private load(eventId: number): void {
        this.isLoading = true;
        this.sharedEventService.getById(eventId).subscribe(event => {
            this.event = event;
            this.isLoading = false;
            setTimeout(() => this.renderCharts(event), 0);
        });
    }

    private renderCharts(event: SharedEventDetail): void {
        this.renderContributed(event);
        this.renderCategoryComposition(event);
    }

    // "Quién puso qué" + "qué le quedó pendiente" en una sola barra divergente por persona: puesto
    // menos consumido (mismo NetBalance que ya calcula el backend, ComputeBalances) — positivo si
    // esa persona puso más de lo que consumió, negativo si le queda algo pendiente de devolver.
    private renderContributed(event: SharedEventDetail): void {
        const rows = event.balances;
        if (rows.length === 0) {
            this.contributedOptions = {};
            return;
        }
        const names = rows.map(b => b.personId === null ? 'Vos' : (b.personName ?? ''));
        const values = rows.map(b => b.netBalance);
        this.contributedOptions = this.chartTheme.divergingBarOptions(names, values, {
            formatValue: v => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 }),
        });
    }

    private renderCategoryComposition(event: SharedEventDetail): void {
        if (event.categoryTotals.length === 0) {
            this.categoryOptions = {};
            return;
        }
        const fmt = (v: number) => this.chartTheme.formatNumber(v, { maximumFractionDigits: 0 });
        this.categoryOptions = this.chartTheme.pieOptions(
            event.categoryTotals.map(c => c.transactionClassName),
            event.categoryTotals.map(c => c.total),
            { donut: true, showLegend: true, formatValue: fmt }
        );
    }
}
