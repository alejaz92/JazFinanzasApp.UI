import { Component, OnInit, ViewChild } from '@angular/core';
import { Person } from '../models/person.model';
import { PersonService } from '../services/person.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-people-list',
    templateUrl: './people-list.component.html',
    imports: [LoadingComponent, NgIf, NgFor, RouterLink, FormsModule, ConfirmModalComponent]
})
export class PeopleListComponent implements OnInit {
  isLoading: boolean = true;
  people: Person[] | null = null;
  searchTerm: string = '';

  @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
  private personIdToDelete: number | null = null;

  constructor(private personService: PersonService, private toastService: ToastService) { }

  ngOnInit(): void {
    this.personService.getAllPeople().subscribe({
      next: (response) => {
        this.people = response;
        this.isLoading = false;
      },
      error: () => {
        this.toastService.error('Error al cargar las personas');
        this.isLoading = false;
      }
    });
  }

  get filteredPeople(): Person[] {
    if (!this.people) return [];
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.people;
    return this.people.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.alias && p.alias.toLowerCase().includes(term))
    );
  }

  onDelete(personId: number): void {
    this.personIdToDelete = personId;
    this.deleteModal.open();
  }

  onDeleteConfirmed(): void {
    if (!this.personIdToDelete) return;

    this.personService.deletePerson(this.personIdToDelete).subscribe({
      next: () => {
        this.toastService.success('Persona eliminada correctamente');
        this.ngOnInit();
      },
      error: (error) => {
        if (error.status === 400) {
          this.toastService.error('No se puede eliminar la persona porque tiene deudas pendientes');
        } else {
          this.toastService.error('Error al eliminar la persona');
        }
      }
    });

    this.personIdToDelete = null;
  }
}
