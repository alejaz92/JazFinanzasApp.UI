import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TripDetail } from '../models/trip-detail.model';
import { TripMovement, TripMovementRef } from '../models/trip-movement.model';
import { TripStatus, TripType } from '../models/trip.model';
import { TripService } from '../services/trip.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';

const STATUS_LABELS: Record<TripStatus, string> = {
  PLANNED: 'Planificado',
  IN_PROGRESS: 'En curso',
  FINISHED: 'Finalizado'
};

const STATUS_BADGE_CLASSES: Record<TripStatus, string> = {
  PLANNED: 'bg-secondary',
  IN_PROGRESS: 'bg-success',
  FINISHED: 'bg-light text-dark'
};

const TYPE_LABELS: Record<TripType, string> = {
  DOMESTIC: 'Doméstico',
  INTERNATIONAL: 'Internacional'
};

@Component({
    selector: 'app-trip-detail',
    templateUrl: './trip-detail.component.html',
    imports: [LoadingComponent, NgIf, NgFor, NgClass, DatePipe, FormsModule, BackButtonComponent, CurrencyFiatFormatPipe]
})
export class TripDetailComponent implements OnInit {
  isLoading: boolean = true;
  id: number = 0;
  trip?: TripDetail;

  suggestions: TripMovement[] = [];
  suggestionsLoading: boolean = true;

  searchTerm: string = '';
  searchResults: TripMovement[] = [];
  searchLoading: boolean = false;
  searchDone: boolean = false;

  private busyRefs = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private tripService: TripService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? Number(idParam) : 0;
    if (!this.id) return;

    this.loadTrip();
    this.loadSuggestions();
  }

  private loadTrip(): void {
    this.tripService.getTripDetail(this.id).subscribe({
      next: (response) => {
        this.trip = response;
        this.isLoading = false;
      },
      error: () => {
        this.toastService.error('Error al cargar el viaje');
        this.isLoading = false;
      }
    });
  }

  private loadSuggestions(): void {
    this.suggestionsLoading = true;
    this.tripService.getSuggestions(this.id).subscribe({
      next: (response) => {
        this.suggestions = response;
        this.suggestionsLoading = false;
      },
      error: () => {
        this.suggestionsLoading = false;
      }
    });
  }

  statusLabel(status: TripStatus): string {
    return STATUS_LABELS[status];
  }

  statusBadgeClass(status: TripStatus): string {
    return STATUS_BADGE_CLASSES[status];
  }

  typeLabel(type: TripType): string {
    return TYPE_LABELS[type];
  }

  private refKey(m: TripMovement): string {
    return `${m.origin}-${m.id}`;
  }

  isBusy(m: TripMovement): boolean {
    return this.busyRefs.has(this.refKey(m));
  }

  onSearch(): void {
    this.searchLoading = true;
    this.searchDone = false;
    this.tripService.searchCandidates(this.id, this.searchTerm.trim()).subscribe({
      next: (response) => {
        this.searchResults = response;
        this.searchLoading = false;
        this.searchDone = true;
      },
      error: () => {
        this.toastService.error('Error al buscar movimientos');
        this.searchLoading = false;
        this.searchDone = true;
      }
    });
  }

  onAssociate(movement: TripMovement): void {
    const ref: TripMovementRef = { type: movement.origin, id: movement.id };
    const key = this.refKey(movement);
    this.busyRefs.add(key);

    this.tripService.associateMovements(this.id, [ref]).subscribe({
      next: () => {
        this.busyRefs.delete(key);
        this.toastService.success('Movimiento asociado al viaje');
        this.searchResults = this.searchResults.filter(m => this.refKey(m) !== key);
        this.loadTrip();
        this.loadSuggestions();
      },
      error: (error) => {
        this.busyRefs.delete(key);
        this.toastService.error(error.error?.message ?? 'Error al asociar el movimiento');
      }
    });
  }

  onDisassociate(movement: TripMovement): void {
    const ref: TripMovementRef = { type: movement.origin, id: movement.id };
    const key = this.refKey(movement);
    this.busyRefs.add(key);

    this.tripService.disassociateMovements(this.id, [ref]).subscribe({
      next: () => {
        this.busyRefs.delete(key);
        this.toastService.success('Movimiento desasociado del viaje');
        this.loadTrip();
      },
      error: (error) => {
        this.busyRefs.delete(key);
        this.toastService.error(error.error?.message ?? 'Error al desasociar el movimiento');
      }
    });
  }

  onDismissSuggestion(movement: TripMovement): void {
    const ref: TripMovementRef = { type: movement.origin, id: movement.id };
    const key = this.refKey(movement);
    this.busyRefs.add(key);

    this.tripService.dismissSuggestion(this.id, ref).subscribe({
      next: () => {
        this.busyRefs.delete(key);
        this.suggestions = this.suggestions.filter(m => this.refKey(m) !== key);
      },
      error: (error) => {
        this.busyRefs.delete(key);
        this.toastService.error(error.error?.message ?? 'Error al descartar la sugerencia');
      }
    });
  }
}
