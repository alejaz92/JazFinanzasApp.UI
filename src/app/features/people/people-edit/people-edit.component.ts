import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Person } from '../models/person.model';
import { PersonAddRequest } from '../models/person-add-request.model';
import { PersonService } from '../services/person.service';

@Component({
  selector: 'app-people-edit',
  templateUrl: './people-edit.component.html'
})
export class PeopleEditComponent implements OnInit, OnDestroy {
  isLoading: boolean = true;
  id: string | null = null;
  person?: Person;
  private paramsSubscription?: Subscription;
  private editSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private personService: PersonService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.paramsSubscription = this.route.paramMap.subscribe({
      next: (params) => {
        this.id = params.get('id');
        if (this.id) {
          this.personService.getPersonById(Number(this.id)).subscribe({
            next: (response) => {
              this.person = response;
              this.isLoading = false;
            }
          });
        }
      }
    });
  }

  onFormSubmit(): void {
    if (!this.id || !this.person) return;

    const request: PersonAddRequest = {
      name: this.person.name,
      alias: this.person.alias?.trim() || undefined
    };

    this.editSubscription = this.personService.updatePerson(Number(this.id), request).subscribe({
      next: () => {
        this.router.navigate(['/management/people']);
      }
    });
  }

  ngOnDestroy(): void {
    this.paramsSubscription?.unsubscribe();
    this.editSubscription?.unsubscribe();
  }
}
