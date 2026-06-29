import { Component, OnInit, ViewChild } from '@angular/core';
import { TransactionClassService} from '../services/transaction-class.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-transaction-class-list',
    templateUrl: './transaction-class-list.component.html',
    styleUrls: ['./transaction-class-list.component.css'],
    imports: [LoadingComponent, NgIf, RouterLink, NgFor, ConfirmModalComponent]
})
export class TransactionClassListComponent implements OnInit {
  isLoading: boolean = true;
  incomeClasses: any[] | null = null;
  expenseClasses: any[] | null = null;

  @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
  private transactionClassIdToDelete: number | null = null;

  constructor(private transactionClassService: TransactionClassService, private toastService: ToastService) { }

  canEditOrDelete(transactionClass: any): boolean {
    return !transactionClass.isSystem;
  };

  ngOnInit(): void {
    this.loadTransactionClasses();  
  }

  loadTransactionClasses(): void {
    this.transactionClassService.getAllTransactionClasses().subscribe((data) => {

      this.incomeClasses = data.filter((x) => x.incExp === 'I');
      this.expenseClasses = data.filter((x) => x.incExp === 'E' );

      this.isLoading = false;
    });
  }

  onDelete(transactionClassId: number): void {
    if (!transactionClassId) return;
    this.transactionClassIdToDelete = transactionClassId;
    this.deleteModal.open();
  }

  onDeleteConfirmed(): void {
    if (!this.transactionClassIdToDelete) return;

    this.transactionClassService.deleteTransactionClass(this.transactionClassIdToDelete)
      .subscribe({
        next: (response) => {
          this.toastService.success('Clase de movimiento eliminada correctamente');
          this.loadTransactionClasses();
        },
        error: (error) => {
          if (error.error == 'Transaction Class is being used in transactions') {
            this.toastService.error('No se puede eliminar la clase de movimiento porque fue utilizada en transacciones');
          }
        }
      });

    this.transactionClassIdToDelete = null;
  }
}
