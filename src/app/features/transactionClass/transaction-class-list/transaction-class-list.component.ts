import { Component, OnInit, ViewChild } from '@angular/core';
import { TransactionClassService} from '../services/transaction-class.service';
import { TransactionClass } from '../models/transactionClass.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

// Agrupa una categoría de primer nivel con sus hijas — jerarquía de un solo nivel (T13,
// docs/plans/activos/plan-rediseno-reportes.md), así que no hace falta un árbol recursivo acá.
interface TransactionClassGroup {
  parent: TransactionClass;
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
  incomeGroups: TransactionClassGroup[] = [];
  expenseGroups: TransactionClassGroup[] = [];

  @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
  private transactionClassIdToDelete: number | null = null;

  constructor(private transactionClassService: TransactionClassService, private toastService: ToastService) { }

  canEditOrDelete(transactionClass: TransactionClass): boolean {
    return !transactionClass.isSystem;
  };

  // Una categoría con subcategorías propias no se puede borrar sin borrar antes las hijas
  // (el FK de ParentId es NoAction) — se deshabilita en vez de dejar que el usuario choque
  // con un error de base de datos.
  canDelete(group: TransactionClassGroup): boolean {
    return this.canEditOrDelete(group.parent) && group.children.length === 0;
  }

  ngOnInit(): void {
    this.loadTransactionClasses();
  }

  loadTransactionClasses(): void {
    this.transactionClassService.getAllTransactionClasses().subscribe((data) => {
      this.incomeGroups = this.buildGroups(data.filter((x) => x.incExp === 'I'));
      this.expenseGroups = this.buildGroups(data.filter((x) => x.incExp === 'E'));

      this.isLoading = false;
    });
  }

  private buildGroups(classes: TransactionClass[]): TransactionClassGroup[] {
    return classes
      .filter(c => !c.parentId)
      .map(parent => ({
        parent,
        children: classes.filter(c => c.parentId === parent.id)
      }));
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
