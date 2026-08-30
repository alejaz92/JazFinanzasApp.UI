import { Component, OnInit, ViewChild } from '@angular/core';
import { TransactionClassService} from '../services/transaction-class.service';
import { TransactionClass } from '../models/transactionClass.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

interface ClassRow extends TransactionClass {
  children: TransactionClass[];
}

@Component({
    selector: 'app-transaction-class-list',
    templateUrl: './transaction-class-list.component.html',
    styleUrls: ['./transaction-class-list.component.css'],
    imports: [LoadingComponent, NgIf, RouterLink, NgFor, ConfirmModalComponent]
})
export class TransactionClassListComponent implements OnInit {
  isLoading: boolean = true;
  incomeClasses: ClassRow[] | null = null;
  expenseClasses: ClassRow[] | null = null;

  @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
  private transactionClassIdToDelete: number | null = null;

  constructor(private transactionClassService: TransactionClassService, private toastService: ToastService) { }

  canEditOrDelete(transactionClass: TransactionClass): boolean {
    return !transactionClass.isSystem;
  };

  ngOnInit(): void {
    this.loadTransactionClasses();
  }

  loadTransactionClasses(): void {
    this.transactionClassService.getAllTransactionClasses().subscribe((data) => {

      this.incomeClasses = this.buildHierarchy(data.filter((x) => x.incExp === 'I'));
      this.expenseClasses = this.buildHierarchy(data.filter((x) => x.incExp === 'E'));

      this.isLoading = false;
    });
  }

  // Rubros (sin padre) con sus subcategorías anidadas debajo — jerarquía de máximo dos niveles.
  private buildHierarchy(classes: TransactionClass[]): ClassRow[] {
    return classes
      .filter((c) => c.parentId == null)
      .map((root) => ({ ...root, children: classes.filter((c) => c.parentId === root.id) }));
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
          } else if (error.error == 'Transaction Class has subcategories') {
            this.toastService.error('No se puede eliminar una categoría que tiene subcategorías');
          }
        }
      });

    this.transactionClassIdToDelete = null;
  }
}
