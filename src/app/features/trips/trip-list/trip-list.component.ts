import { Component, OnInit, ViewChild } from '@angular/core';
import { Trip, TripStatus, TripType } from '../models/trip.model';
import { TripService } from '../services/trip.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

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
    selector: 'app-trip-list',
    templateUrl: './trip-list.component.html',
    imports: [LoadingComponent, NgIf, NgFor, NgClass, DatePipe, RouterLink, FormsModule, ConfirmModalComponent]
})
export class TripListComponent implements OnInit {
  isLoading: boolean = true;
  trips: Trip[] | null = null;
  searchTerm: string = '';

  @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
  private tripIdToDelete: number | null = null;

  constructor(private tripService: TripService, private toastService: ToastService) { }

  ngOnInit(): void {
    this.tripService.getAllTrips().subscribe({
      next: (response) => {
        this.trips = response;
        this.isLoading = false;
      },
      error: () => {
        this.toastService.error('Error al cargar los viajes');
        this.isLoading = false;
      }
    });
  }

  get filteredTrips(): Trip[] {
    if (!this.trips) return [];
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.trips;
    return this.trips.filter(t => t.name.toLowerCase().includes(term));
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

  onDelete(tripId: number): void {
    this.tripIdToDelete = tripId;
    this.deleteModal.open();
  }

  onDeleteConfirmed(): void {
    if (!this.tripIdToDelete) return;

    this.tripService.deleteTrip(this.tripIdToDelete).subscribe({
      next: () => {
        this.toastService.success('Viaje eliminado correctamente');
        this.ngOnInit();
      },
      error: () => {
        this.toastService.error('Error al eliminar el viaje');
      }
    });

    this.tripIdToDelete = null;
  }
}
