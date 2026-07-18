import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, DecimalPipe } from '@angular/common';
import { SharedEventService } from '../services/shared-event.service';
import { SharedEventMovement, SharedEventMovementAddRequest, SharedEventParticipant } from '../models/shared-event.model';
import { TransactionClassService } from '../../transactionClass/services/transaction-class.service';
import { AssetService } from '../../asset/services/asset.service';
import { AccountService } from '../../account/services/account.service';
import { CardService } from '../../card/services/card.service';
import { ToastService } from '../../../core/services/toast.service';

const ME = 'me';

interface ShareRow {
  key: string; // 'me' o el personId como string
  personId: number | null;
  personName: string;
  amount: number;
  percentage: number;
}

@Component({
    selector: 'app-shared-event-movement-form',
    templateUrl: './shared-event-movement-form.component.html',
    imports: [FormsModule, NgFor, NgIf, DecimalPipe]
})
export class SharedEventMovementFormComponent implements OnInit, OnChanges {
  @Input() eventId!: number;
  @Input() participants: SharedEventParticipant[] = [];
  @Input() editingMovement: SharedEventMovement | null = null;

  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  date: string = '';
  description: string = '';
  transactionClassId: string = '';
  assetId: string = '';
  totalAmount: number = 0;

  payerSelection: string = ME; // 'me' o personId como string
  paymentMode: 'account' | 'card' = 'account';
  accountId: string = '';
  cardId: string = '';
  installments: number = 1;
  firstInstallment: string = '';

  notes: string = '';

  splitMode: 'equal' | 'amount' | 'percentage' = 'equal';
  rows: ShareRow[] = [];
  selectedRowKey: string = '';

  transactionClasses: any[] = [];
  assets: any[] = [];
  accounts: any[] = [];
  cards: any[] = [];

  errorMessage: string = '';
  isSaving: boolean = false;

  // Se recalcula explícitamente (no es un getter) para no generar un array nuevo
  // en cada ciclo de detección de cambios -- eso hacía que el *ngFor sobre este
  // array recreara las <option> del <select> sin parar, entrando en loop con
  // el ValueAccessor de ngModel sobre <select>.
  availableToAdd: { key: string; label: string }[] = [];

  constructor(
    private sharedEventService: SharedEventService,
    private transactionClassService: TransactionClassService,
    private assetService: AssetService,
    private accountService: AccountService,
    private cardService: CardService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.transactionClassService.getAllTransactionClasses().subscribe((data: any) => {
      this.transactionClasses = data.filter((c: any) => c.incExp === 'E');
    });
    this.assetService.getAssetsByTypeName('Moneda').subscribe((data: any) => {
      this.assets = data;
    });
    this.accountService.getAccountByTypeName('Moneda').subscribe((data: any) => {
      this.accounts = data;
    });
    this.cardService.getAllCards().subscribe((data: any) => {
      this.cards = data;
    });

    if (this.editingMovement) {
      this.loadFromMovement(this.editingMovement);
    }

    this.updateAvailableToAdd();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingMovement'] && this.editingMovement) {
      this.loadFromMovement(this.editingMovement);
    }
    if (changes['participants']) {
      this.updateAvailableToAdd();
    }
  }

  private loadFromMovement(m: SharedEventMovement): void {
    this.date = m.date.substring(0, 10);
    this.description = m.description;
    this.transactionClassId = String(m.transactionClassId);
    this.assetId = String(m.assetId);
    this.totalAmount = m.totalAmount;
    this.payerSelection = m.payerPersonId === null ? ME : String(m.payerPersonId);
    this.paymentMode = m.cardTransactionId ? 'card' : 'account';
    this.notes = m.notes ?? '';

    this.rows = m.shares.map(s => ({
      key: s.personId === null ? ME : String(s.personId),
      personId: s.personId,
      personName: s.personId === null ? 'Vos' : (s.personName ?? ''),
      amount: s.amount,
      percentage: this.totalAmount > 0 ? Math.round((s.amount / this.totalAmount * 100) * 100) / 100 : 0
    }));
    this.updateAvailableToAdd();
  }

  get isEditing(): boolean {
    return !!this.editingMovement;
  }

  get payerIsMe(): boolean {
    return this.payerSelection === ME;
  }

  private updateAvailableToAdd(): void {
    const used = new Set(this.rows.map(r => r.key));
    const options: { key: string; label: string }[] = [];
    if (!used.has(ME)) options.push({ key: ME, label: 'Vos' });
    this.participants
      .filter(p => !used.has(String(p.personId)))
      .forEach(p => options.push({ key: String(p.personId), label: p.personName }));
    this.availableToAdd = options;
  }

  addRow(): void {
    if (!this.selectedRowKey) return;

    if (this.selectedRowKey === ME) {
      this.rows.push({ key: ME, personId: null, personName: 'Vos', amount: 0, percentage: 0 });
    } else {
      const personId = Number(this.selectedRowKey);
      const person = this.participants.find(p => p.personId === personId);
      if (!person) return;
      this.rows.push({ key: this.selectedRowKey, personId, personName: person.personName, amount: 0, percentage: 0 });
    }

    this.selectedRowKey = '';
    this.recalculate();
    this.updateAvailableToAdd();
  }

  removeRow(index: number): void {
    this.rows.splice(index, 1);
    this.recalculate();
    this.updateAvailableToAdd();
  }

  onModeChange(): void {
    this.recalculate();
  }

  onTotalAmountChange(): void {
    this.recalculate();
  }

  recalculate(): void {
    if (this.splitMode === 'equal') {
      const n = this.rows.length;
      if (n === 0) return;
      const rounded = Math.floor((this.totalAmount / n) * 100) / 100;
      this.rows.forEach(r => r.amount = rounded);
      // ajuste de redondeo: el resto va a la última fila
      const assigned = rounded * (n - 1);
      const last = this.rows[n - 1];
      last.amount = Math.round((this.totalAmount - assigned) * 100) / 100;
      this.rows.forEach(r => r.percentage = this.totalAmount > 0 ? Math.round((r.amount / this.totalAmount * 100) * 100) / 100 : 0);
    } else if (this.splitMode === 'percentage') {
      this.rows.forEach(r => r.amount = Math.round((this.totalAmount * r.percentage / 100) * 100) / 100);
    }
  }

  onAmountChange(row: ShareRow): void {
    if (this.totalAmount > 0) {
      row.percentage = Math.round((row.amount / this.totalAmount * 100) * 100) / 100;
    }
  }

  onPercentageChange(row: ShareRow): void {
    row.amount = Math.round((this.totalAmount * row.percentage / 100) * 100) / 100;
  }

  get sumOfShares(): number {
    return Math.round(this.rows.reduce((sum, r) => sum + r.amount, 0) * 100) / 100;
  }

  get sharesValid(): boolean {
    return this.rows.length > 0
      && this.rows.every(r => r.amount > 0)
      && Math.abs(this.sumOfShares - this.totalAmount) < 0.01;
  }

  get paymentValid(): boolean {
    if (!this.payerIsMe) return true;
    if (this.paymentMode === 'account') return !!this.accountId;
    return !!this.cardId && this.installments > 0 && !!this.firstInstallment;
  }

  get formValid(): boolean {
    return !!this.date && !!this.description && !!this.transactionClassId && !!this.assetId
      && this.totalAmount > 0 && this.sharesValid && this.paymentValid;
  }

  onSubmit(): void {
    this.errorMessage = '';
    if (!this.formValid) return;

    const payerPersonId = this.payerIsMe ? null : Number(this.payerSelection);

    const request: SharedEventMovementAddRequest = {
      date: this.date,
      description: this.description,
      transactionClassId: Number(this.transactionClassId),
      assetId: Number(this.assetId),
      totalAmount: this.totalAmount,
      payerPersonId,
      shares: this.rows.map(r => ({ personId: r.personId, amount: r.amount })),
      payment: this.payerIsMe
        ? (this.paymentMode === 'account'
          ? { accountId: Number(this.accountId) }
          : { cardId: Number(this.cardId), installments: this.installments, firstInstallment: this.firstInstallment + '-01' })
        : null,
      notes: this.notes || undefined
    };

    this.isSaving = true;
    const obs = this.isEditing
      ? this.sharedEventService.updateMovement(this.eventId, this.editingMovement!.id, request)
      : this.sharedEventService.addMovement(this.eventId, request);

    obs.subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.success(this.isEditing ? 'Movimiento actualizado' : 'Movimiento agregado');
        this.saved.emit();
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error.error?.message ?? 'Error al guardar el movimiento';
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
