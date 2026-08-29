import { Component, OnInit, ViewChild } from '@angular/core';
import { MerchantListItem, MerchantMovement } from '../models/merchant.model';
import { MerchantService } from '../services/merchant.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

// Fila del listado, con el estado propio de la pantalla (edición inline, movimientos expandidos)
// además de los datos que devuelve el backend.
interface MerchantRow extends MerchantListItem {
  expanded: boolean;
  movements: MerchantMovement[] | null;
  mergeTargetId: number | null;
}

@Component({
    selector: 'app-merchant-list',
    templateUrl: './merchant-list.component.html',
    imports: [LoadingComponent, NgIf, NgFor, DatePipe, FormsModule, ConfirmModalComponent, CurrencyFiatFormatPipe]
})
export class MerchantListComponent implements OnInit {
  isLoading = true;
  isResolving = false;
  merchants: MerchantRow[] = [];
  searchTerm: string = '';

  editingId: number | null = null;
  editingName: string = '';

  @ViewChild('mergeModal') mergeModal!: ConfirmModalComponent;
  pendingMerge: { sourceId: number; targetId: number; sourceName: string; targetName: string } | null = null;

  constructor(private merchantService: MerchantService, private toastService: ToastService) { }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.merchantService.getAllMerchants().subscribe({
      next: (data) => {
        this.merchants = data.map(m => ({ ...m, expanded: false, movements: null, mergeTargetId: null }));
        this.isLoading = false;
      },
      error: () => {
        this.toastService.error('Error al cargar los comercios');
        this.isLoading = false;
      }
    });
  }

  get filteredMerchants(): MerchantRow[] {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.merchants;
    return this.merchants.filter(m => m.name.toLowerCase().includes(term));
  }

  otherMerchants(excludeId: number): MerchantListItem[] {
    return this.merchants.filter(m => m.id !== excludeId);
  }

  // La app no llama al resolver sola cuando se carga un movimiento nuevo (no está en el alcance
  // de esta fase — ver Resultado real de la Fase 9) — este botón es, por ahora, la única forma
  // de que los movimientos que se van cargando de acá en adelante consigan un comercio.
  resolveAll(): void {
    this.isResolving = true;
    this.merchantService.resolveAll().subscribe({
      next: (result) => {
        this.isResolving = false;
        const total = result.transactionsResolved + result.cardTransactionsResolved;
        this.toastService.success(
          total > 0
            ? `Se resolvieron ${total} movimientos (${result.merchantsCreated} comercios nuevos).`
            : 'No había movimientos pendientes de resolver.'
        );
        this.load();
      },
      error: () => {
        this.isResolving = false;
        this.toastService.error('Error al ejecutar la resolución masiva');
      }
    });
  }

  startEdit(row: MerchantRow): void {
    this.editingId = row.id;
    this.editingName = row.name;
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(row: MerchantRow): void {
    const name = this.editingName.trim();
    if (!name) return;

    this.merchantService.renameMerchant(row.id, name).subscribe({
      next: () => {
        row.name = name;
        row.isConfirmed = true;
        this.editingId = null;
        this.toastService.success('Comercio renombrado correctamente');
      },
      error: () => this.toastService.error('Error al renombrar el comercio')
    });
  }

  toggleMovements(row: MerchantRow): void {
    row.expanded = !row.expanded;
    if (row.expanded && row.movements === null) {
      this.merchantService.getMovements(row.id).subscribe({
        next: (movements) => row.movements = movements,
        error: () => this.toastService.error('Error al cargar los movimientos del comercio')
      });
    }
  }

  requestMerge(row: MerchantRow): void {
    if (!row.mergeTargetId) return;
    const target = this.merchants.find(m => m.id === row.mergeTargetId);
    if (!target) return;

    this.pendingMerge = { sourceId: row.id, targetId: target.id, sourceName: row.name, targetName: target.name };
    this.mergeModal.open();
  }

  get mergeMessage(): string {
    if (!this.pendingMerge) return '';
    return `Se van a mover todos los movimientos y alias de "${this.pendingMerge.sourceName}" a "${this.pendingMerge.targetName}", y "${this.pendingMerge.sourceName}" va a dejar de existir. ¿Confirmás?`;
  }

  onMergeConfirmed(): void {
    if (!this.pendingMerge) return;
    const { sourceId, targetId } = this.pendingMerge;

    this.merchantService.mergeMerchants(sourceId, targetId).subscribe({
      next: () => {
        this.toastService.success('Comercios fusionados correctamente');
        this.pendingMerge = null;
        this.load();
      },
      error: () => {
        this.toastService.error('Error al fusionar los comercios');
        this.pendingMerge = null;
      }
    });
  }

  reassignMovement(row: MerchantRow, movement: MerchantMovement, newMerchantId: number): void {
    if (!newMerchantId) return;

    const call = movement.source === 'Transaction'
      ? this.merchantService.reassignTransaction(newMerchantId, movement.id)
      : this.merchantService.reassignCardTransaction(newMerchantId, movement.id);

    call.subscribe({
      next: () => {
        this.toastService.success('Movimiento reasignado correctamente');
        this.load();
      },
      error: () => this.toastService.error('Error al reasignar el movimiento')
    });
  }
}
