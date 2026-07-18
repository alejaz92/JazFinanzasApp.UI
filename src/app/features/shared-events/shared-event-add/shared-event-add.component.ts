import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SharedEventService } from '../services/shared-event.service';
import { PersonService } from '../../people/services/person.service';
import { Person } from '../../people/models/person.model';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
    selector: 'app-shared-event-add',
    templateUrl: './shared-event-add.component.html',
    imports: [FormsModule, NgFor, NgIf, RouterLink, BackButtonComponent]
})
export class SharedEventAddComponent implements OnInit {
  name: string = '';
  notes: string = '';
  people: Person[] = [];
  selectedPersonIds = new Set<number>();

  constructor(
    private sharedEventService: SharedEventService,
    private personService: PersonService,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.personService.getAllPeople().subscribe((data) => {
      this.people = data;
    });
  }

  togglePerson(personId: number): void {
    if (this.selectedPersonIds.has(personId)) {
      this.selectedPersonIds.delete(personId);
    } else {
      this.selectedPersonIds.add(personId);
    }
  }

  isSelected(personId: number): boolean {
    return this.selectedPersonIds.has(personId);
  }

  onFormSubmit(): void {
    this.sharedEventService.create({
      name: this.name,
      notes: this.notes || undefined,
      personIds: Array.from(this.selectedPersonIds)
    }).subscribe({
      next: (created) => {
        this.toastService.success('Evento creado correctamente');
        this.router.navigate(['/shared-events', created.id]);
      },
      error: (error) => {
        this.toastService.error(error.error?.message ?? 'Error al crear el evento');
      }
    });
  }
}
