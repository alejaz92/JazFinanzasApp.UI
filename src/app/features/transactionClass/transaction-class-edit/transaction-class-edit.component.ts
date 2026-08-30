import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { TransactionClass } from '../models/transactionClass.model';
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
  hasChildren = false;

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
          const id = Number(this.id);
          forkJoin({
            transactionClass: this.transactionClassService.getTransactionClassById(id),
            allClasses: this.transactionClassService.getAllTransactionClasses()
          }).subscribe({
            next: ({ transactionClass, allClasses }) => {
              this.transactionClass = transactionClass;
              this.allClasses = allClasses;
              this.hasChildren = allClasses.some((c) => c.parentId === id);
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

  // Solo los rubros (sin padre) del mismo tipo, distintos de esta categoría, pueden elegirse como padre.
  get parentOptions(): TransactionClass[] {
    if (!this.transactionClass) return [];
    return this.allClasses.filter((c) => c.parentId == null && c.incExp === this.transactionClass!.incExp && c.id !== this.transactionClass!.id);
  }

  onFormSubmit(): void {
    if (this.isSubmitting) return;

    const transactionClassUpdateRequest: TransactionClass = {
      incExp: this.transactionClass?.incExp ?? '',
      id: this.transactionClass?.id ?? 0,
      description: this.transactionClass?.description ?? '',
      countsAsIncomeExpense: this.transactionClass?.countsAsIncomeExpense ?? true,
      parentId: this.transactionClass?.parentId ?? null
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
