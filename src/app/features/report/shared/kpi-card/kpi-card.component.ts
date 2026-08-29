import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Puerto del kpi-card de JazSIGE, con dos agregados que pide la Fase 4 del plan
// (docs/plans/activos/plan-rediseno-reportes.md): variación contra un período de comparación
// (sección 6: "todo número clave muestra su variación") y una mini-tendencia en SVG —
// deliberadamente no un gráfico de ECharts: una fila de indicadores puede tener varias
// instancias de esta tarjeta a la vez, y no vale la pena una instancia de ECharts por cada una
// para un trazo decorativo de un puñado de puntos.
@Component({
    selector: 'app-kpi-card',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './kpi-card.component.html',
    styleUrl: './kpi-card.component.scss'
})
export class KpiCardComponent {
    @Input() title = '';
    /** String ya formateado (ej. "$ 1.234,56" o "42"). */
    @Input() value = '';
    /** Línea secundaria opcional debajo del valor. */
    @Input() subtitle = '';
    /** Clase de color adicional sobre el valor, ej. "text-success" / "text-danger". */
    @Input() valueClass = '';
    /** Variación porcentual contra el período de comparación (ej. 12.4 o -3.2). Sin valor = no se muestra. */
    @Input() variationPct: number | null = null;
    /** Serie chica para la mini-tendencia (sparkline). Sin valor o < 2 puntos = no se muestra. */
    @Input() trend: number[] | null = null;
    /** Si se pasa, toda la tarjeta navega a esa ruta al hacer click. */
    @Input() routerLink: string | unknown[] | null = null;

    get sparklinePoints(): string | null {
        const data = this.trend;
        if (!data || data.length < 2) return null;

        const width = 100;
        const height = 28;
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;

        return data
            .map((v, i) => {
                const x = (i / (data.length - 1)) * width;
                const y = height - ((v - min) / range) * height;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');
    }
}
