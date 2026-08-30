import { Component, OnDestroy, OnInit } from '@angular/core';
import { TransactionClassAddRequest } from '../models/transactionClass-addRequest.model';
import { TransactionClass } from '../models/transactionClass.model';
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
export class TransactionClassAddComponent implements OnInit, OnDestroy{
  model: TransactionClassAddRequest;
  isSubmitting = false;
  allClasses: TransactionClass[] = [];
  private addTransactionClassSubscription?: Subscription;

  constructor(
    private transactionClassService: TransactionClassService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.model = {
      description: '',
      incExp: 'E',
      countsAsIncomeExpense: true,
      parentId: null
    };
  }

  ngOnInit(): void {
    this.transactionClassService.getAllTransactionClasses().subscribe((data) => {
      this.allClasses = data;
    });
  }

  // Solo los rubros (sin padre) del mismo tipo pueden elegirse como padre — máximo dos niveles.
  get parentOptions(): TransactionClass[] {
    return this.allClasses.filter((c) => c.parentId == null && c.incExp === this.model.incExp);
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
  }
}
