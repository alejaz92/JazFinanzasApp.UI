import { Component, OnDestroy } from '@angular/core';
import { CardAddRequest } from '../models/card-add-request.model';
import { CardService } from '../services/card.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-card-add',
  templateUrl: './card-add.component.html',
  styleUrls: ['./card-add.component.css']
})
export class CardAddComponent implements OnDestroy {

  model: CardAddRequest;
  private addCardSubscription?: Subscription;

  constructor(private cardService: CardService, 
    private router: Router) 
  {
    this.model = {
      name: ''
    };
  }


  onFormSubmit() {
    this.addCardSubscription = this.cardService.addCard(this.model)
      .subscribe({
        next: (response) => {
          this.router.navigate(['/management/card']);
        }
      })
  }

  ngOnDestroy(): void {
    this.addCardSubscription?.unsubscribe();
  }
}