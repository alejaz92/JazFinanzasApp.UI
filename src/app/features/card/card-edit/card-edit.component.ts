import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CardService } from '../services/card.service';
import { Card } from '../models/card.model';
import { CardUpdateRequest } from '../models/card-update-request.model';

@Component({
  selector: 'app-card-edit',
  templateUrl: './card-edit.component.html',
  styleUrls: ['./card-edit.component.css']
})
export class CardEditComponent implements OnInit, OnDestroy {

  id: string | null = null;
  paramsSubcription?: Subscription;
  editCardSubscription?: Subscription;
  card?: Card;

  constructor(private route: ActivatedRoute, private cardService: CardService, private router: Router) {  }

  ngOnInit(): void {
    this.paramsSubcription = this.route.paramMap.subscribe({
      next: (params) => {
        this.id = params.get('id');

        if (this.id) {
          // Get data from server
          this.cardService.getCardById(Number(this.id)).subscribe({
            next: (response) => {
              this.card = response;
            }
          });
        } 
      }
    });
  }

  onFormSubmit(): void {
    const cardUpdateRequest: CardUpdateRequest = {
      name: this.card?.name ?? ''
    };


    if (this.id) {
      this.editCardSubscription = this.cardService.updateCard(Number(this.id), cardUpdateRequest).subscribe({
        next: (response) => {
          this.router.navigateByUrl('/management/card');
        }
      });
    }
      
    
  } 


  ngOnDestroy(): void {
    this.paramsSubcription?.unsubscribe();
    this.editCardSubscription?.unsubscribe();
  };

}
