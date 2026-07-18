import { Component, OnInit, ViewChild } from '@angular/core';
import { SharedEventListItem } from '../models/shared-event.model';
import { SharedEventService } from '../services/shared-event.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-shared-events-list',
    templateUrl: './shared-events-list.component.html',
    imports: [LoadingComponent, NgIf, NgFor, RouterLink, FormsModule, ConfirmModalComponent]
})
export class SharedEventsListComponent implements OnInit {
  isLoading: boolean = true;
  events: SharedEventListItem[] | null = null;
  includeClosed: boolean = false;
  searchTerm: string = '';

  @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
  private eventIdToDelete: number | null = null;

  constructor(private sharedEventService: SharedEventService, private toastService: ToastService) { }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.sharedEventService.getAll(this.includeClosed).subscribe({
      next: (response) => {
        this.events = response;
        this.isLoading = false;
      },
      error: () => {
        this.toastService.error('Error al cargar los eventos compartidos');
        this.isLoading = false;
      }
    });
  }

  onIncludeClosedChange(): void {
    this.load();
  }

  get filteredEvents(): SharedEventListItem[] {
    if (!this.events) return [];
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.events;
    return this.events.filter(e => e.name.toLowerCase().includes(term));
  }

  onDelete(eventId: number): void {
    this.eventIdToDelete = eventId;
    this.deleteModal.open();
  }

  onDeleteConfirmed(): void {
    if (!this.eventIdToDelete) return;

    this.sharedEventService.delete(this.eventIdToDelete).subscribe({
      next: () => {
        this.toastService.success('Evento eliminado correctamente');
        this.load();
      },
      error: (error) => {
        this.toastService.error(error.error?.message ?? 'Error al eliminar el evento');
      }
    });

    this.eventIdToDelete = null;
  }
}
