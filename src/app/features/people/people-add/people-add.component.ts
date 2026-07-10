import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PersonAddRequest } from '../models/person-add-request.model';
import { PersonService } from '../services/person.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
    selector: 'app-people-add',
    templateUrl: './people-add.component.html',
    imports: [FormsModule, BackButtonComponent]
})
export class PeopleAddComponent implements OnDestroy {
  model: PersonAddRequest;
  private addSubscription?: Subscription;

  constructor(
    private personService: PersonService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.model = { name: '', alias: '' };
  }

  onFormSubmit(): void {
    const request: PersonAddRequest = {
      name: this.model.name,
      alias: this.model.alias?.trim() || undefined
    };

    this.addSubscription = this.personService.addPerson(request).subscribe({
      next: () => {
        this.toastService.success('Persona agregada correctamente');
        this.router.navigate(['/management/people']);
      },
      error: () => {
        this.toastService.error('Error al agregar la persona');
      }
    });
  }

  ngOnDestroy(): void {
    this.addSubscription?.unsubscribe();
  }
}
