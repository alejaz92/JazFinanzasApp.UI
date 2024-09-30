import { Component, OnInit } from '@angular/core';
import { CardService } from '../services/card.service';
import { Card } from '../models/card.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-card-list',
  templateUrl: './card-list.component.html',
  styleUrls: ['./card-list.component.css']
})
export class CardListComponent implements OnInit {
  cards$?: Observable<Card[]>;
  constructor(private cardService: CardService) { 

  }
  ngOnInit(): void {
    this.cards$ = this.cardService.getAllCards();      
  }

  onDelete(cardId: number): void {
    if(cardId){
      this.cardService.deleteCard(cardId)
      .subscribe({
        next: (response) => {
          alert('Card deleted successfully');
          this.ngOnInit();
        }
      });
    }
    
  }


}
