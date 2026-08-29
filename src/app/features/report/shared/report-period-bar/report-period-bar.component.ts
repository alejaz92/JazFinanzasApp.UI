import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportContextService, PeriodPreset } from '../../services/report-context.service';

const PRESET_LABELS: Record<PeriodPreset, string> = {
    'this-month': 'Este mes',
    'last-month': 'Mes pasado',
    'last-12-months': 'Últimos 12 meses',
    'this-year': 'Este año',
    'last-year': 'Año pasado',
    'all': 'Todo',
    'custom': 'Rango'
};

@Component({
    selector: 'app-report-period-bar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './report-period-bar.component.html',
    styleUrl: './report-period-bar.component.scss'
})
export class ReportPeriodBarComponent {
    readonly presets: PeriodPreset[] = ['this-month', 'last-month', 'last-12-months', 'this-year', 'last-year', 'all', 'custom'];
    readonly presetLabels = PRESET_LABELS;

    // Elegir "Rango" solo muestra los inputs de fecha — el filtro no cambia hasta Aplicar,
    // mismo patrón que el date-range-filter de JazSIGE.
    customMode = false;
    customFrom = '';
    customTo = '';

    constructor(readonly context: ReportContextService) {}

    get activePreset(): PeriodPreset {
        return this.customMode ? 'custom' : this.context.period().preset;
    }

    selectPreset(preset: PeriodPreset): void {
        if (preset === 'custom') {
            const current = this.context.period();
            this.customFrom = current.from;
            this.customTo = current.to;
            this.customMode = true;
            return;
        }
        this.customMode = false;
        this.context.setPreset(preset);
    }

    applyCustomRange(): void {
        if (!this.customFrom || !this.customTo) return;
        this.context.setCustomRange(this.customFrom, this.customTo);
    }

    onCurrencyChange(assetId: number): void {
        this.context.setCurrency(assetId);
    }
}
