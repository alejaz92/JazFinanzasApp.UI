import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { TransactionClass, TRANSACTION_CLASS_NATURES, TRANSACTION_CLASS_NATURE_LABELS } from '../models/transactionClass.model';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionClassService } from '../services/transaction-class.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { SubmitButtonComponent } from '../../../shared/components/submit-button/submit-button.component';

@Component({
    selector: 'app-transaction-class-edit',
    templateUrl: './transaction-class-edit.component.html',
    styleUrls: ['./transaction-class-edit.component.css'],
    imports: [LoadingComponent, NgIf, NgFor, FormsModule, BackButtonComponent, SubmitButtonComponent]
})
export class TransactionClassEditComponent implements OnInit, OnDestroy{
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  id: string | null = null;
  paramsSubcription?: Subscription;
  editTransactionClassSubscription?: Subscription;
  transactionClass?: TransactionClass;
  allClasses: TransactionClass[] = [];

  readonly natures = TRANSACTION_CLASS_NATURES;
  readonly natureLabels = TRANSACTION_CLASS_NATURE_LABELS;

  constructor(
    private route: ActivatedRoute,
    private transactionClassService: TransactionClassService,
    private router: Router,
    private toastService: ToastService
  ) {  }

  ngOnInit(): void {
    this.paramsSubcription = this.route.paramMap.subscribe({
      next: (params) => {
        this.id = params.get('id');

        if (this.id) {
          forkJoin({
            transactionClass: this.transactionClassService.getTransactionClassById(Number(this.id)),
            allClasses: this.transactionClassService.getAllTransactionClasses()
          }).subscribe({
            next: ({ transactionClass, allClasses }) => {
              this.transactionClass = transactionClass;
              this.allClasses = allClasses;
              this.isLoading = false;
            },
            error: () => {
              this.isLoading = false;
            }
          });
        }
      }
    });
  }

  // Candidatas a padre: sin padre propio, del mismo tipo, y no la categoría que se está editando
  // (T13 — no puede ser su propio padre).
  get availableParents(): TransactionClass[] {
    if (!this.transactionClass) return [];
    return this.allClasses.filter(c =>
      !c.parentId && c.incExp === this.transactionClass!.incExp && c.id !== this.transactionClass!.id
    );
  }

  // T13: una categoría que ya tiene hijos no puede pasar a tener padre — el selector se
  // deshabilita en vez de dejar que el usuario elija algo que el backend va a rechazar.
  get hasOwnChildren(): boolean {
    if (!this.transactionClass) return false;
    return this.allClasses.some(c => c.parentId === this.transactionClass!.id);
  }

  onFormSubmit(): void {
    if (this.isSubmitting) return;

    const transactionClassUpdateRequest: TransactionClass = {
      incExp: this.transactionClass?.incExp ?? '',
      id: this.transactionClass?.id ?? 0,
      description: this.transactionClass?.description ?? '',
      parentId: this.hasOwnChildren ? null : (this.transactionClass?.parentId ?? null),
      nature: this.transactionClass?.nature ?? null
    };

    if (this.id) {
      this.isSubmitting = true;
      this.editTransactionClassSubscription = this.transactionClassService.updateTransactionClass(Number(this.id), transactionClassUpdateRequest).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.toastService.success('Clase de movimiento actualizada correctamente');
          this.router.navigateByUrl('/management/transactionClass');
        },
        error: () => {
          this.isSubmitting = false;
          this.toastService.error('Error al actualizar la clase de movimiento');
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.paramsSubcription?.unsubscribe();
    this.editTransactionClassSubscription?.unsubscribe();
  }

}
