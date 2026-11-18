import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonService } from 'src/app/features/people/services/person.service';
import { Person } from 'src/app/features/people/models/person.model';
import { CurrencyFiatFormatPipe } from 'src/app/shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import {
  DIFFERENCE_SUM_TOLERANCE,
  PurchaseDifferenceChoice,
  PurchaseDifferenceContext,
  PurchaseDifferenceKind
} from '../models/purchase-difference.model';

declare const bootstrap: any;

interface PersonRow {
  personId: number | null;
  amount: number | null;
}

// Pregunta qué fue la diferencia entre el valor de la cuota de una compra con tarjeta y lo que se pagó: un descuento del banco, la parte de otras
// personas o un total mal cargado (plan-repartos-y-descuentos-faltantes.md). Se usa al pagar el resumen y en la pantalla de compras que no cierran.
// Cerrarlo sin elegir cuenta como "lo veo después": no se carga nada.
@Component({
  selector: 'app-purchase-difference-dialog',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, CurrencyFiatFormatPipe],
  templateUrl: './purchase-difference-dialog.component.html'
})
export class PurchaseDifferenceDialogComponent implements OnInit {
  @Output() chosen = new EventEmitter<PurchaseDifferenceChoice>();

  @ViewChild('modalRef') modalRef!: ElementRef;

  context: PurchaseDifferenceContext | null = null;
  selected: PurchaseDifferenceKind | null = null;
  rows: PersonRow[] = [];
  people: Person[] = [];

  private modalInstance: any;
  private answered = false;

  constructor(private personService: PersonService) { }

  ngOnInit(): void {
    this.personService.getAllPeople().subscribe({
      next: (people) => this.people = people,
      error: () => this.people = []
    });
  }

  // Cuánto se pagó de menos (positivo) o de más (negativo) que el valor de la cuota.
  get paidLess(): boolean {
    return (this.context?.difference ?? 0) > 0;
  }

  get absoluteDifference(): number {
    return Math.abs(this.context?.difference ?? 0);
  }

  get title(): string {
    return this.paidLess ? 'Pagás menos que la cuota' : 'Pagás más que la cuota';
  }

  // Lo que todavía falta repartir entre las personas (negativo si se repartió de más).
  get remaining(): number {
    return this.round(this.absoluteDifference - this.assigned);
  }

  get assigned(): number {
    return this.round(this.rows.reduce((sum, r) => sum + (r.amount ?? 0), 0));
  }

  get canConfirm(): boolean {
    if (this.selected === null) return false;
    if (this.selected !== 'People') return true;
    return this.rows.length > 0
      && this.rows.every(r => r.personId !== null && (r.amount ?? 0) > 0)
      && Math.abs(this.remaining) <= DIFFERENCE_SUM_TOLERANCE;
  }

  open(context: PurchaseDifferenceContext): void {
    this.context = context;
    this.answered = false;
    // Se pagó de menos: lo más común es un descuento; de más: corregir el total, si se puede.
    this.selected = null;
    this.rows = [];

    const el = this.modalRef?.nativeElement as HTMLElement | null;
    if (!el) return;
    this.modalInstance = new bootstrap.Modal(el);
    // Cerrar el diálogo sin elegir (la X, la tecla Escape o hacer clic afuera) es "lo veo después".
    el.addEventListener('hidden.bs.modal', () => {
      if (!this.answered) this.emit({ kind: 'Later' });
    }, { once: true });
    this.modalInstance.show();
  }

  select(kind: PurchaseDifferenceKind): void {
    this.selected = kind;
    if (kind === 'People' && this.rows.length === 0) this.addRow();
  }

  addRow(): void {
    // La primera persona arranca con toda la diferencia; las siguientes, con lo que falta.
    const suggested = Math.max(this.remaining, 0);
    this.rows.push({ personId: null, amount: suggested > 0 ? suggested : null });
  }

  removeRow(index: number): void {
    this.rows.splice(index, 1);
  }

  personName(person: Person): string {
    return person.alias ? `${person.name} (${person.alias})` : person.name;
  }

  confirm(): void {
    if (!this.canConfirm || this.selected === null) return;

    if (this.selected === 'People') {
      this.choose({
        kind: 'People',
        people: this.rows.map(r => ({ personId: r.personId as number, amount: this.round(r.amount as number) }))
      });
      return;
    }
    this.choose({ kind: this.selected });
  }

  later(): void {
    this.choose({ kind: 'Later' });
  }

  revert(): void {
    this.choose({ kind: 'Revert' });
  }

  private choose(choice: PurchaseDifferenceChoice): void {
    this.emit(choice);
    this.modalInstance?.hide();
  }

  private emit(choice: PurchaseDifferenceChoice): void {
    if (this.answered) return;
    this.answered = true;
    this.chosen.emit(choice);
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
