import { Component, OnDestroy } from '@angular/core';
import { TransactionClassAddRequest } from '../models/transactionClass-addRequest.model';
import { Subscription } from 'rxjs';
import { TransactionClassService } from '../services/transaction-class.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
    selector: 'app-transaction-class-add',
    templateUrl: './transaction-class-add.component.html',
    styleUrls: ['./transaction-class-add.component.css'],
    imports: [FormsModule, BackButtonComponent]
})
export class TransactionClassAddComponent implements OnDestroy{
  model: TransactionClassAddRequest;
  private addTransactionClassSubscription?: Subscription;

  constructor(
    private transactionClassService: TransactionClassService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.model = {
      description: '',
      incExp: ''
    };
  }

  onFormSubmit() {
    this.addTransactionClassSubscription = this.transactionClassService.addTransactionClass(this.model)
      .subscribe({
        next: (response) => {
          this.toastService.success('Clase de movimiento creada correctamente');
          this.router.navigate(['/management/transactionClass']);
        },
        error: (error) => {
          this.toastService.error('Error al crear la clase de movimiento');
        }
      })
  }

  ngOnDestroy(): void {
    this.addTransactionClassSubscription?.unsubscribe();
  }
}
