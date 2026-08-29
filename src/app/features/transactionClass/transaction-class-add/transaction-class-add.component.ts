import { Component, OnDestroy, OnInit } from '@angular/core';
import { TransactionClassAddRequest } from '../models/transactionClass-addRequest.model';
import { TransactionClass, TRANSACTION_CLASS_NATURES, TRANSACTION_CLASS_NATURE_LABELS } from '../models/transactionClass.model';
import { Subscription } from 'rxjs';
import { TransactionClassService } from '../services/transaction-class.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { SubmitButtonComponent } from '../../../shared/components/submit-button/submit-button.component';

@Component({
    selector: 'app-transaction-class-add',
    templateUrl: './transaction-class-add.component.html',
    styleUrls: ['./transaction-class-add.component.css'],
    imports: [FormsModule, NgFor, BackButtonComponent, SubmitButtonComponent]
})
export class TransactionClassAddComponent implements OnInit, OnDestroy {
  model: TransactionClassAddRequest;
  isSubmitting = false;
  allClasses: TransactionClass[] = [];

  readonly natures = TRANSACTION_CLASS_NATURES;
  readonly natureLabels = TRANSACTION_CLASS_NATURE_LABELS;

  private addTransactionClassSubscription?: Subscription;
  private loadClassesSubscription?: Subscription;

  constructor(
    private transactionClassService: TransactionClassService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.model = {
      description: '',
      incExp: '',
      parentId: null,
      nature: null
    };
  }

  ngOnInit(): void {
    // Candidatas a padre: solo categorías sin padre propio (T13, jerarquía de un solo nivel).
    this.loadClassesSubscription = this.transactionClassService.getAllTransactionClasses()
      .subscribe(classes => this.allClasses = classes);
  }

  // Filtradas por el mismo tipo (Ingreso/Egreso) que se está eligiendo — evita mezclar una
  // categoría de egreso bajo un padre de ingreso, aunque el backend no lo prohíbe.
  get availableParents(): TransactionClass[] {
    return this.allClasses.filter(c => !c.parentId && c.incExp === this.model.incExp);
  }

  onFormSubmit() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    this.addTransactionClassSubscription = this.transactionClassService.addTransactionClass(this.model)
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.toastService.success('Clase de movimiento creada correctamente');
          this.router.navigate(['/management/transactionClass']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.toastService.error('Error al crear la clase de movimiento');
        }
      })
  }

  ngOnDestroy(): void {
    this.addTransactionClassSubscription?.unsubscribe();
    this.loadClassesSubscription?.unsubscribe();
  }
}
