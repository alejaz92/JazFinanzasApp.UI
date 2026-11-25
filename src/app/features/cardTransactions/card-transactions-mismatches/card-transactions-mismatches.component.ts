import { Component, OnInit, ViewChild } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoadingComponent } from 'src/app/core/components/loading/loading.component';
import { ToastService } from 'src/app/core/services/toast.service';
import { BackButtonComponent } from 'src/app/shared/components/back-button/back-button.component';
import { CurrencyFiatFormatPipe } from 'src/app/shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { CardTransactionsService } from '../services/card-transactions.service';
import { PurchaseDifferenceDialogComponent } from '../purchase-difference-dialog/purchase-difference-dialog.component';
import { CardPurchaseMismatch } from '../models/card-purchase-mismatch.model';
import { PurchaseDifference, PurchaseDifferenceChoice } from '../models/purchase-difference.model';

// Las compras con tarjeta que no cierran: lo que se dejó de pagar de sus cuotas no coincide con lo que explican su reparto y sus descuentos
// (plan-repartos-y-descuentos-faltantes.md, Fase 8). Desde acá se explica la diferencia (un descuento, la parte de otras personas o un total mal
// cargado) o se va a corregir la cuota. Explicar no toca ningún saldo.
@Component({
  selector: 'app-card-transactions-mismatches',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe, RouterLink, LoadingComponent, BackButtonComponent, CurrencyFiatFormatPipe, PurchaseDifferenceDialogComponent],
  templateUrl: './card-transactions-mismatches.component.html'
})
export class CardTransactionsMismatchesComponent implements OnInit {
  isLoading = true;
  isSaving = false;
  loadFailed = false;
  mismatches: CardPurchaseMismatch[] = [];

  // A dónde vuelve el botón "Volver" de la edición de una cuota.
  readonly returnUrl = '/cardTransactions/mismatches';

  @ViewChild('differenceDialog') differenceDialog?: PurchaseDifferenceDialogComponent;
  private asking: CardPurchaseMismatch | null = null;

  constructor(
    private cardTransactionService: CardTransactionsService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.cardTransactionService.getPurchaseMismatches().subscribe({
      next: (mismatches) => {
        this.mismatches = mismatches;
        this.loadFailed = false;
        this.isLoading = false;
        this.isSaving = false;
      },
      error: () => {
        this.loadFailed = true;
        this.isLoading = false;
        this.isSaving = false;
        this.toastService.error('No se pudieron cargar las compras que no cierran');
      }
    });
  }

  get underpaidCount(): number {
    return this.mismatches.filter(m => m.direction === 'Underpaid').length;
  }

  get overpaidCount(): number {
    return this.mismatches.filter(m => m.direction === 'Overpaid').length;
  }

  // "ARS" y "USD" son los símbolos de las monedas; en pantalla van como "$" y "US$".
  symbolOf(m: CardPurchaseMismatch): string {
    switch (m.assetSymbol) {
      case 'ARS': return '$';
      case 'USD': return 'US$';
      default: return m.assetSymbol;
    }
  }

  isPaidLess(m: CardPurchaseMismatch): boolean {
    return m.direction === 'Underpaid';
  }

  // Corregir el total solo sirve en una compra de una cuota pagada de más y sin reparto ni descuento: es la misma regla del backend.
  canFixTotal(m: CardPurchaseMismatch): boolean {
    return m.direction === 'Overpaid' && m.installments === 1 && m.paidInstallments === 1 && m.explained === 0;
  }

  // Un descuento o un reparto explican haber pagado de menos; pagando de más, solo corregir el total.
  canExplain(m: CardPurchaseMismatch): boolean {
    return this.isPaidLess(m) || this.canFixTotal(m);
  }

  directionLabel(m: CardPurchaseMismatch): string {
    return this.isPaidLess(m) ? 'Se pagó de menos' : 'Se pagó de más';
  }

  // Lo que se muestra cuando no hay un botón para explicarla: qué pasó y qué hacer.
  hint(m: CardPurchaseMismatch): string | null {
    if (this.canExplain(m)) return null;
    return m.explained > 0
      ? 'Hay más reparto o descuento cargado que lo que se dejó de pagar. Corregí la cuota o el reparto.'
      : 'Corregí la cuota.';
  }

  explain(m: CardPurchaseMismatch): void {
    if (!this.canExplain(m) || this.isSaving) return;

    this.asking = m;
    const symbol = this.symbolOf(m);
    const amount = new CurrencyFiatFormatPipe().transform(m.difference, symbol);
    const paidLess = this.isPaidLess(m);

    this.differenceDialog?.open({
      detail: m.detail,
      title: paidLess ? 'Se pagó de menos' : 'Se pagó de más',
      summary: paidLess
        ? `Las cuotas pagadas de «${m.detail}» salieron ${amount} menos de lo que valen.`
        : `Las cuotas pagadas de «${m.detail}» salieron ${amount} más de lo que valen.`,
      difference: paidLess ? m.difference : -m.difference,
      symbol,
      allowFixTotal: this.canFixTotal(m),
      // Acá la cuota ya se pagó: no hay un monto que volver a su valor.
      allowRevert: false
    });
  }

  onDifferenceChosen(choice: PurchaseDifferenceChoice): void {
    const m = this.asking;
    this.asking = null;
    // Cancelar (o cerrar el diálogo): no se carga nada y la compra sigue en la lista. Las opciones de una suscripción y "es un error" no se
    // ofrecen acá.
    if (!m || (choice.kind !== 'Discount' && choice.kind !== 'People' && choice.kind !== 'FixTotal')) return;

    const body: PurchaseDifference = choice.kind === 'People'
      ? { kind: 'People', people: choice.people }
      : { kind: choice.kind };

    this.isSaving = true;
    this.cardTransactionService.explainPurchaseDifference(m.cardTransactionId, body).subscribe({
      next: () => {
        this.toastService.success('La compra quedó explicada');
        // Se vuelve a pedir la lista: la compra tiene que salir (si cierra) o seguir con lo que falte.
        this.load();
      },
      error: (error) => {
        this.isSaving = false;
        this.toastService.error(error?.error?.message ?? 'No se pudo cargar la explicación');
      }
    });
  }
}
