import { Component, OnInit, ViewChild } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { BondCollectionService } from '../services/bond-collection.service';
import {
    BondCollectionListItem,
    BondCollectionPending,
    BondCollectionStatus
} from '../models/bondCollection.model';
import { TransactionClassService } from '../../transactionClass/services/transaction-class.service';
import { TransactionClass } from '../../transactionClass/models/transactionClass.model';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { SubmitButtonComponent } from '../../../shared/components/submit-button/submit-button.component';

// Cobros de bonos (plan-amortizaciones-bonos.md, Fase 6): los pagos de bono (capital + interés) que
// ya ocurrieron y todavía no se registraron, para registrarlos o descartarlos, y el historial de lo
// registrado.
@Component({
    selector: 'app-bond-collections',
    templateUrl: './bond-collections.component.html',
    styleUrls: ['./bond-collections.component.css'],
    imports: [NgClass, NgFor, NgIf, ReactiveFormsModule, DatePipe, DecimalPipe, BackButtonComponent, ConfirmModalComponent, SubmitButtonComponent]
})
export class BondCollectionsComponent implements OnInit {
    form!: FormGroup;

    pending: BondCollectionPending[] = [];
    registered: BondCollectionListItem[] = [];
    incomeClasses: TransactionClass[] = [];
    private lastInterestClassId: number | null = null;

    isLoading = true;
    isSubmitting = false;
    isDismissing = false;

    selected: BondCollectionPending | null = null;

    @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
    deleteModalMessage = '';
    private toDelete: BondCollectionListItem | null = null;

    @ViewChild('dismissModal') dismissModal!: ConfirmModalComponent;

    constructor(
        private fb: FormBuilder,
        private bondCollectionService: BondCollectionService,
        private transactionClassService: TransactionClassService,
        private toastService: ToastService
    ) { }

    ngOnInit(): void {
        this.form = this.fb.group({
            collectionDate: ['', Validators.required],
            capitalAmount: [0, [Validators.required, Validators.min(0)]],
            interestAmount: [0, [Validators.required, Validators.min(0)]],
            interestClassId: [null as number | null]
        });

        // La categoría del interés tiene que ser de ingreso y contar como ingreso en Reportes (el
        // backend lo valida igual); la de capital no se elige: va siempre a "Ingreso Inversiones".
        forkJoin({
            classes: this.transactionClassService.getAllTransactionClasses(),
            lastClassId: this.bondCollectionService.getLastInterestClassId()
        }).subscribe({
            next: ({ classes, lastClassId }) => {
                this.incomeClasses = classes.filter(c => c.incExp === 'I' && c.countsAsIncomeExpense);
                this.lastInterestClassId = lastClassId ?? null;
            },
            error: () => this.toastService.error('Error al cargar las categorías.')
        });

        this.reload();
    }

    private reload(): void {
        this.isLoading = true;
        forkJoin({
            pending: this.bondCollectionService.getPending(),
            registered: this.bondCollectionService.getRegistered()
        }).subscribe({
            next: ({ pending, registered }) => {
                this.pending = pending;
                this.registered = registered;
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
                this.toastService.error('Error al cargar los cobros de bonos.');
            }
        });
    }

    isSelected(item: BondCollectionPending): boolean {
        return !!this.selected
            && this.selected.bondPaymentId === item.bondPaymentId
            && this.selected.accountId === item.accountId
            && this.selected.portfolioId === item.portfolioId;
    }

    select(item: BondCollectionPending): void {
        this.selected = item;
        const interestClassId = this.incomeClasses.some(c => c.id === this.lastInterestClassId)
            ? this.lastInterestClassId
            : null;
        this.form.reset({
            collectionDate: item.paymentDate.substring(0, 10),
            // Bono indexado: no hay estimación, se arranca en 0 y el usuario carga lo que informa el broker.
            capitalAmount: item.estimatedCapital ?? 0,
            interestAmount: item.estimatedInterest ?? 0,
            interestClassId
        });
    }

    cancelSelection(): void {
        this.selected = null;
    }

    get interestAmountValue(): number {
        return Number(this.form.get('interestAmount')?.value) || 0;
    }

    get capitalAmountValue(): number {
        return Number(this.form.get('capitalAmount')?.value) || 0;
    }

    onSubmit(): void {
        if (!this.selected || this.form.invalid || this.isSubmitting) return;

        if (this.capitalAmountValue === 0 && this.interestAmountValue === 0) {
            this.toastService.error('Al menos uno de los montos tiene que ser mayor a cero.');
            return;
        }

        const interestClassId = this.form.value.interestClassId as number | null;
        if (this.interestAmountValue > 0 && interestClassId === null) {
            this.toastService.error('Elegí la categoría del interés.');
            return;
        }

        this.isSubmitting = true;
        this.bondCollectionService.register({
            bondPaymentId: this.selected.bondPaymentId,
            accountId: this.selected.accountId,
            portfolioId: this.selected.portfolioId,
            collectionDate: this.form.value.collectionDate,
            capitalAmount: this.capitalAmountValue,
            interestAmount: this.interestAmountValue,
            interestTransactionClassId: this.interestAmountValue > 0 ? interestClassId : null
        }).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.toastService.success('Cobro registrado correctamente.');
                if (this.interestAmountValue > 0) this.lastInterestClassId = interestClassId;
                this.selected = null;
                this.reload();
            },
            error: (err) => {
                this.isSubmitting = false;
                this.toastService.error(err?.error?.message || 'Error al registrar el cobro.');
            }
        });
    }

    onDismiss(): void {
        if (!this.selected) return;
        this.dismissModal.open();
    }

    onDismissConfirmed(): void {
        if (!this.selected || this.isDismissing) return;

        this.isDismissing = true;
        this.bondCollectionService.dismiss({
            bondPaymentId: this.selected.bondPaymentId,
            accountId: this.selected.accountId,
            portfolioId: this.selected.portfolioId
        }).subscribe({
            next: () => {
                this.isDismissing = false;
                this.toastService.success('Pago descartado: no se registró ningún movimiento.');
                this.selected = null;
                this.reload();
            },
            error: (err) => {
                this.isDismissing = false;
                this.toastService.error(err?.error?.message || 'Error al descartar el pago.');
            }
        });
    }

    onDelete(item: BondCollectionListItem): void {
        const dateStr = new Date(item.paymentDate).toLocaleDateString('es-AR');
        this.toDelete = item;
        this.deleteModalMessage = item.status === 'Registered'
            ? `¿Eliminar el cobro de ${item.symbol} del ${dateStr}? Se borran también los movimientos que generó en la cuenta y el pago vuelve a figurar como pendiente.`
            : `¿Eliminar este registro de ${item.symbol} del ${dateStr}? El pago vuelve a figurar como pendiente.`;
        this.deleteModal.open();
    }

    onDeleteConfirmed(): void {
        if (!this.toDelete) return;
        const id = this.toDelete.id;
        this.toDelete = null;

        this.bondCollectionService.delete(id).subscribe({
            next: () => {
                this.toastService.success('Cobro eliminado correctamente.');
                this.reload();
            },
            error: (err) => {
                this.toastService.error(err?.error?.message || 'Error al eliminar el cobro.');
            }
        });
    }

    statusLabel(status: BondCollectionStatus): string {
        switch (status) {
            case 'Registered': return 'Registrado';
            case 'Untracked': return 'Sin movimiento';
            case 'Dismissed': return 'No cobrado';
            default: return status;
        }
    }

    statusClass(status: BondCollectionStatus): string {
        switch (status) {
            case 'Registered': return 'bg-success';
            case 'Untracked': return 'bg-secondary';
            case 'Dismissed': return 'bg-warning text-dark';
            default: return 'bg-secondary';
        }
    }

    statusHint(status: BondCollectionStatus): string {
        switch (status) {
            case 'Registered': return 'Cobro registrado, con sus movimientos en la cuenta.';
            case 'Untracked': return 'Cobrado, pero sin un movimiento identificable en el historial: cuenta para el rendimiento del bono sin tocar ninguna cuenta.';
            case 'Dismissed': return 'No hubo cobro: no se registró ningún movimiento.';
            default: return '';
        }
    }
}
