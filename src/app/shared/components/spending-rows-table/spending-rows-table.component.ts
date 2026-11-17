import { Component, Input } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';

import { SpendingRow } from '../../../features/report/models/income-expense.model';
import { CurrencyFiatFormatPipe } from '../../pipes/currencyFiatFormat/currency-fiat-format.pipe';

// El detalle de lo que compone el gasto por compra (plan-ingresos-egresos-por-fecha-de-compra.md, decisión D y Fase 9): una fila por gasto, con su origen. Lo
// comparten los paneles de Por categoría, del día del Calendario y de Por etiqueta cuando el reporte cuenta por compra.
//   - una cuota se muestra como "Cuota 2 de 6", con la fecha de la compra y lo que costó (tu parte);
//   - un recurrente, rotulado "recurrente" y con su tarjeta;
//   - una compra compartida, con tu parte junto al total y a lo que pusieron los demás;
//   - un monto en otra moneda que la elegida, con el original además del convertido.
// Al pie, la suma de las filas: es el número del bloque que se abrió.
@Component({
    selector: 'app-spending-rows-table',
    standalone: true,
    imports: [NgIf, NgFor, DatePipe, CurrencyFiatFormatPipe],
    templateUrl: './spending-rows-table.component.html'
})
export class SpendingRowsTableComponent {
    @Input({ required: true }) rows: SpendingRow[] = [];

    /** La moneda elegida en la barra: una fila en otra moneda muestra además su monto original. */
    @Input() selectedAssetId: number | null = null;

    /** El panel de un solo día no necesita la columna de fecha. */
    @Input() showDate = true;

    get total(): number {
        return Math.round(this.rows.reduce((sum, r) => sum + r.amount, 0) * 100) / 100;
    }

    isInstallment(row: SpendingRow): boolean {
        return row.kind === 'CardInstallment' && (row.installments ?? 1) > 1;
    }

    isForeign(row: SpendingRow): boolean {
        return row.nativeAssetId != null && this.selectedAssetId != null && row.nativeAssetId !== this.selectedAssetId;
    }

    /** Una compra con tarjeta en la que otros pusieron plata o hubo un descuento del banco: el total y la parte de los demás se muestran junto a la tuya. */
    hasReimbursement(row: SpendingRow): boolean {
        return row.kind !== 'Direct' && ((row.nativeOthersShare ?? 0) > 0 || (row.nativeDiscounts ?? 0) > 0);
    }

    /** Lo que quedó a cargo del usuario, en la moneda de la compra. */
    ownShare(row: SpendingRow): number {
        return Math.max(0, (row.nativeGrossTotal ?? 0) - (row.nativeOthersShare ?? 0) - (row.nativeDiscounts ?? 0));
    }

    /** Un monto en la moneda del movimiento, con su símbolo ("US$ 10,00"). */
    formatNative(value: number | null | undefined, row: SpendingRow): string {
        const number = (value ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return row.nativeAssetSymbol ? `${row.nativeAssetSymbol} ${number}` : number;
    }

    origin(row: SpendingRow): string {
        return (row.kind === 'Direct' ? row.accountName : row.cardName) ?? '—';
    }
}
