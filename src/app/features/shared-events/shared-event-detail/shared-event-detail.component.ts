import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedEventService } from '../services/shared-event.service';
import { SharedEventDetail, SharedEventMovement } from '../models/shared-event.model';
import { PersonService } from '../../people/services/person.service';
import { Person } from '../../people/models/person.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { SharedEventMovementFormComponent } from '../shared-event-movement-form/shared-event-movement-form.component';
import { SharedEventPaymentFormComponent } from '../shared-event-payment-form/shared-event-payment-form.component';

@Component({
    selector: 'app-shared-event-detail',
    templateUrl: './shared-event-detail.component.html',
    imports: [LoadingComponent, NgIf, NgFor, DecimalPipe, DatePipe, FormsModule, BackButtonComponent, ConfirmModalComponent, SharedEventMovementFormComponent, SharedEventPaymentFormComponent]
})
export class SharedEventDetailComponent implements OnInit {
  isLoading: boolean = true;
  id: number = 0;
  event?: SharedEventDetail;

  editingHeader: boolean = false;
  editName: string = '';
  editNotes: string = '';

  allPeople: Person[] = [];
  selectedNewParticipantId: string = '';
  // Se recalcula explícitamente (no es un getter) para no generar un array nuevo
  // en cada ciclo de detección de cambios -- ver el mismo comentario en
  // shared-event-movement-form.component.ts.
  availablePeopleToAdd: Person[] = [];

  showMovementForm: boolean = false;
  editingMovement: SharedEventMovement | null = null;

  showPaymentForm: boolean = false;

  @ViewChild('deleteEventModal') deleteEventModal!: ConfirmModalComponent;
  @ViewChild('deleteMovementModal') deleteMovementModal!: ConfirmModalComponent;
  @ViewChild('deletePaymentModal') deletePaymentModal!: ConfirmModalComponent;
  private movementIdToDelete: number | null = null;
  private paymentIdToDelete: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sharedEventService: SharedEventService,
    private personService: PersonService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? Number(idParam) : 0;
    if (!this.id) return;

    this.load();
    this.personService.getAllPeople().subscribe(data => {
      this.allPeople = data;
      this.updateAvailablePeopleToAdd();
    });
  }

  load(): void {
    this.sharedEventService.getById(this.id).subscribe({
      next: (response) => {
        this.event = response;
        this.isLoading = false;
        this.updateAvailablePeopleToAdd();
      },
      error: () => {
        this.toastService.error('Error al cargar el evento');
        this.isLoading = false;
      }
    });
  }

  private updateAvailablePeopleToAdd(): void {
    if (!this.event) {
      this.availablePeopleToAdd = [];
      return;
    }
    const currentIds = new Set(this.event.participants.map(p => p.personId));
    this.availablePeopleToAdd = this.allPeople.filter(p => !currentIds.has(p.id));
  }

  // ── Encabezado ────────────────────────────────────────────────────────

  onEditHeader(): void {
    if (!this.event) return;
    this.editName = this.event.name;
    this.editNotes = this.event.notes ?? '';
    this.editingHeader = true;
  }

  onSaveHeader(): void {
    this.sharedEventService.update(this.id, { name: this.editName, notes: this.editNotes || undefined }).subscribe({
      next: () => {
        this.toastService.success('Evento actualizado');
        this.editingHeader = false;
        this.load();
      },
      error: (error) => {
        this.toastService.error(error.error?.message ?? 'Error al actualizar el evento');
      }
    });
  }

  onCancelEditHeader(): void {
    this.editingHeader = false;
  }

  onClose(): void {
    this.sharedEventService.close(this.id).subscribe({
      next: () => {
        this.toastService.success('Evento cerrado');
        this.load();
      },
      error: (error) => {
        this.toastService.error(error.error?.message ?? 'Error al cerrar el evento');
      }
    });
  }

  onReopen(): void {
    this.sharedEventService.reopen(this.id).subscribe({
      next: () => {
        this.toastService.success('Evento reabierto');
        this.load();
      },
      error: (error) => {
        this.toastService.error(error.error?.message ?? 'Error al reabrir el evento');
      }
    });
  }

  onDeleteEvent(): void {
    this.deleteEventModal.open();
  }

  onDeleteEventConfirmed(): void {
    this.sharedEventService.delete(this.id).subscribe({
      next: () => {
        this.toastService.success('Evento eliminado');
        this.router.navigate(['/shared-events']);
      },
      error: (error) => {
        this.toastService.error(error.error?.message ?? 'Error al eliminar el evento');
      }
    });
  }

  // ── Participantes ────────────────────────────────────────────────────

  onAddParticipant(): void {
    if (!this.selectedNewParticipantId) return;
    this.sharedEventService.addParticipant(this.id, { personId: Number(this.selectedNewParticipantId) }).subscribe({
      next: () => {
        this.toastService.success('Participante agregado');
        this.selectedNewParticipantId = '';
        this.load();
      },
      error: (error) => {
        this.toastService.error(error.error?.message ?? 'Error al agregar el participante');
      }
    });
  }

  onRemoveParticipant(personId: number): void {
    this.sharedEventService.removeParticipant(this.id, personId).subscribe({
      next: () => {
        this.toastService.success('Participante quitado');
        this.load();
      },
      error: (error) => {
        this.toastService.error(error.error?.message ?? 'Error al quitar el participante');
      }
    });
  }

  // ── Movimientos ───────────────────────────────────────────────────────

  onAddMovement(): void {
    this.editingMovement = null;
    this.showMovementForm = true;
  }

  onEditMovement(movement: SharedEventMovement): void {
    this.editingMovement = movement;
    this.showMovementForm = true;
  }

  onMovementSaved(): void {
    this.showMovementForm = false;
    this.editingMovement = null;
    this.load();
  }

  onMovementCancelled(): void {
    this.showMovementForm = false;
    this.editingMovement = null;
  }

  onDeleteMovement(movementId: number): void {
    this.movementIdToDelete = movementId;
    this.deleteMovementModal.open();
  }

  onDeleteMovementConfirmed(): void {
    if (!this.movementIdToDelete) return;

    this.sharedEventService.deleteMovement(this.id, this.movementIdToDelete).subscribe({
      next: () => {
        this.toastService.success('Movimiento eliminado');
        this.load();
      },
      error: (error) => {
        this.toastService.error(error.error?.message ?? 'Error al eliminar el movimiento');
      }
    });

    this.movementIdToDelete = null;
  }

  // ── Pagos ─────────────────────────────────────────────────────────────

  onAddPayment(): void {
    this.showPaymentForm = true;
  }

  onPaymentSaved(): void {
    this.showPaymentForm = false;
    this.load();
  }

  onPaymentCancelled(): void {
    this.showPaymentForm = false;
  }

  isLastPayment(paymentId: number): boolean {
    if (!this.event || this.event.payments.length === 0) return false;
    const maxId = Math.max(...this.event.payments.map(p => p.id));
    return paymentId === maxId;
  }

  onDeletePayment(paymentId: number): void {
    this.paymentIdToDelete = paymentId;
    this.deletePaymentModal.open();
  }

  onDeletePaymentConfirmed(): void {
    if (!this.paymentIdToDelete) return;

    this.sharedEventService.deletePayment(this.id, this.paymentIdToDelete).subscribe({
      next: () => {
        this.toastService.success('Pago eliminado');
        this.load();
      },
      error: (error) => {
        this.toastService.error(error.error?.message ?? 'Error al eliminar el pago');
      }
    });

    this.paymentIdToDelete = null;
  }
}
