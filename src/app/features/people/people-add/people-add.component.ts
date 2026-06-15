import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PersonAddRequest } from '../models/person-add-request.model';
import { PersonService } from '../services/person.service';

@Component({
  selector: 'app-people-add',
  templateUrl: './people-add.component.html'
})
export class PeopleAddComponent implements OnDestroy {
  model: PersonAddRequest;
  private addSubscription?: Subscription;

  constructor(private personService: PersonService, private router: Router) {
    this.model = { name: '', alias: '' };
  }

  onFormSubmit(): void {
    const request: PersonAddRequest = {
      name: this.model.name,
      alias: this.model.alias?.trim() || undefined
    };

    this.addSubscription = this.personService.addPerson(request).subscribe({
      next: () => {
        this.router.navigate(['/management/people']);
      }
    });
  }

  ngOnDestroy(): void {
    this.addSubscription?.unsubscribe();
  }
}
