import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, DecimalPipe, DatePipe } from '@angular/common';
import { SharedEventService } from '../services/shared-event.service';
import {
  SharedEventBalance,
  SharedEventParticipant,
  SharedEventPaymentAddRequest,
  SharedEventPaymentPreviewItem
} from '../models/shared-event.model';
import { AssetService } from '../../asset/services/asset.service';
import { AccountService } from '../../account/services/account.service';
import { ToastService } from '../../../core/services/toast.service';

type PaymentKind = 'incoming' | 'outgoing' | 'third-party' | 'internal';

interface PreviewRow extends SharedEventPaymentPreviewItem {
  editedAmount: number;
}

interface Suggestion {
  label: string;
  kind: 'incoming' | 'outgoing';
  personId: number;
  assetId: number;
  amount: number;
}

@Component({
  selector: 'app-shared-event-payment-form',
  templateUrl: './shared-event-payment-form.component.html',
  imports: [FormsModule, NgFor, NgIf, DecimalPipe, DatePipe]
})
export class SharedEventPaymentFormComponent implements OnInit {
  @Input() eventId!: number;
  @Input() participants: SharedEventParticipant[] = [];
  @Input() balances: SharedEventBalance[] = [];

  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  kind: PaymentKind = 'incoming';

  date: string = '';
  assetId: string = '';
  amount: number = 0;
  accountId: string = '';
  fromPersonId: string = '';
  toPersonId: string = '';
  notes: string = '';

  assets: any[] = [];
  accounts: any[] = [];

  suggestions: Suggestion[] = [];

  previewLoading: boolean = false;
  previewRequested: boolean = false;
  previewRows: PreviewRow[] = [];
  previewError: string = '';
  manualOverride: boolean = false;

  errorMessage: string = '';
  isSaving: boolean = false;

  constructor(
    private sharedEventService: SharedEventService,
    private assetService: AssetService,
    private accountService: AccountService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.assetService.getAssetsByTypeName('Moneda').subscribe((data: any) => this.assets = data);
    this.accountService.getAccountByTypeName('Moneda').subscribe((data: any) => this.accounts = data);
    this.date = new Date().toISOString().substring(0, 10);
    this.updateSuggestions();
  }

  private updateSuggestions(): void {
    this.suggestions = this.balances
      .filter(b => b.personId !== null && Math.abs(b.netBalance) > 0.01)
      .map(b => b.netBalance < 0
        ? { label: `Cobrar a ${b.personName}: ${Math.abs(b.netBalance).toFixed(2)} ${b.assetSymbol}`, kind: 'incoming' as const, personId: b.personId!, assetId: b.assetId, amount: Math.abs(b.netBalance) }
        : { label: `Pagarle a ${b.personName}: ${b.netBalance.toFixed(2)} ${b.assetSymbol}`, kind: 'outgoing' as const, personId: b.personId!, assetId: b.assetId, amount: b.netBalance });
  }

  applySuggestion(s: Suggestion): void {
    this.kind = s.kind;
    this.assetId = String(s.assetId);
    this.amount = s.amount;
    if (s.kind === 'incoming') {
      this.fromPersonId = String(s.personId);
      this.toPersonId = '';
    } else {
      this.toPersonId = String(s.personId);
      this.fromPersonId = '';
    }
    this.resetPreview();
  }

  onKindChange(): void {
    this.fromPersonId = '';
    this.toPersonId = '';
    if (this.kind === 'internal') this.amount = 0;
    this.resetPreview();
  }

  resetPreview(): void {
    this.previewRequested = false;
    this.previewRows = [];
    this.previewError = '';
    this.manualOverride = false;
  }

  get needsAccount(): boolean {
    return this.kind === 'incoming' || this.kind === 'outgoing' || this.kind === 'internal';
  }

  get needsPreview(): boolean {
    return this.kind === 'incoming' || this.kind === 'outgoing' || this.kind === 'internal';
  }

  get formValid(): boolean {
    if (!this.date || !this.assetId) return false;
    if (this.kind === 'incoming') return !!this.fromPersonId && this.amount > 0 && !!this.accountId;
    if (this.kind === 'outgoing') return !!this.toPersonId && this.amount > 0 && !!this.accountId;
    if (this.kind === 'internal') return !!this.accountId;
    return !!this.fromPersonId && !!this.toPersonId && this.fromPersonId !== this.toPersonId && this.amount > 0;
  }

  private buildRequest(): SharedEventPaymentAddRequest {
    return {
      date: this.date,
      assetId: Number(this.assetId),
      amount: this.kind === 'internal' ? 0 : this.amount,
      fromPersonId: this.kind === 'incoming' ? Number(this.fromPersonId) : (this.kind === 'third-party' ? Number(this.fromPersonId) : null),
      toPersonId: this.kind === 'outgoing' ? Number(this.toPersonId) : (this.kind === 'third-party' ? Number(this.toPersonId) : null),
      accountId: this.needsAccount ? Number(this.accountId) : null,
      isInternalCompensation: this.kind === 'internal',
      notes: this.notes || undefined
    };
  }

  onPreview(): void {
    if (!this.formValid) return;
    this.previewError = '';
    this.previewLoading = true;

    this.sharedEventService.previewPayment(this.eventId, this.buildRequest()).subscribe({
      next: (result) => {
        this.previewLoading = false;
        this.previewRequested = true;
        this.manualOverride = false;
        this.previewRows = result.items.map(i => ({ ...i, editedAmount: i.amount }));
      },
      error: (error) => {
        this.previewLoading = false;
        this.previewError = error.error?.message ?? 'Error al calcular la imputación';
      }
    });
  }

  onRowAmountChange(): void {
    this.manualOverride = true;
  }

  get creditRows(): PreviewRow[] {
    return this.previewRows.filter(r => r.kind === 'Credit');
  }

  get debtRows(): PreviewRow[] {
    return this.previewRows.filter(r => r.kind === 'Debt');
  }

  get allocatedNet(): number {
    const credits = this.creditRows.reduce((sum, r) => sum + r.editedAmount, 0);
    const debts = this.debtRows.reduce((sum, r) => sum + r.editedAmount, 0);
    return Math.round((credits - debts) * 100) / 100;
  }

  get expectedNet(): number {
    if (this.kind === 'internal') return 0;
    if (this.kind === 'incoming') return this.amount;
    if (this.kind === 'outgoing') return -this.amount;
    return 0;
  }

  get allocationValid(): boolean {
    if (!this.needsPreview) return true;
    if (!this.previewRequested) return false;
    return Math.abs(this.allocatedNet - this.expectedNet) < 0.01;
  }

  get canSubmit(): boolean {
    if (!this.formValid) return false;
    if (this.kind === 'third-party') return true;
    return this.allocationValid;
  }

  onSubmit(): void {
    this.errorMessage = '';
    if (!this.canSubmit) return;

    const request = this.buildRequest();
    if (this.needsPreview && this.manualOverride) {
      request.allocations = this.previewRows
        .filter(r => r.editedAmount > 0)
        .map(r => ({ splitId: r.splitId, shareId: r.shareId, amount: r.editedAmount }));
    }

    this.isSaving = true;
    this.sharedEventService.createPayment(this.eventId, request).subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.success('Pago registrado');
        this.saved.emit();
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error.error?.message ?? 'Error al registrar el pago';
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
