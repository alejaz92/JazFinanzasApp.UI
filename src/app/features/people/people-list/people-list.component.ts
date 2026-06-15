import { Component, OnInit } from '@angular/core';
import { Person } from '../models/person.model';
import { PersonService } from '../services/person.service';

@Component({
  selector: 'app-people-list',
  templateUrl: './people-list.component.html'
})
export class PeopleListComponent implements OnInit {
  isLoading: boolean = true;
  people: Person[] | null = null;

  constructor(private personService: PersonService) { }

  ngOnInit(): void {
    this.personService.getAllPeople().subscribe((response) => {
      this.people = response;
      this.isLoading = false;
    });
  }

  onDelete(personId: number): void {
    const confirmed = window.confirm('¿Estás seguro de eliminar esta persona?');
    if (confirmed) {
      this.personService.deletePerson(personId).subscribe({
        next: () => {
          alert('Persona eliminada correctamente');
          this.ngOnInit();
        },
        error: (error) => {
          if (error.status === 400) {
            alert('No se puede eliminar la persona porque tiene deudas pendientes');
          } else {
            alert('Error al eliminar la persona');
          }
        }
      });
    }
  }
}
