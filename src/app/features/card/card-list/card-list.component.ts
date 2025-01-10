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
  isLoading: boolean = true;
  cards: any[] | null = null;
  constructor(private cardService: CardService) { 

  }
  ngOnInit(): void {
    this.cardService.getAllCards().subscribe((response) => {
      this.cards = response;
      this.isLoading = false;
    });
  }

  onDelete(cardId: number): void {
    if(cardId){

      const confirmed = window.confirm('¿Estás seguro de eliminar esta tarjeta?');
      if(confirmed) {
        this.cardService.deleteCard(cardId)
        .subscribe({
          next: (response) => {
            alert('Tarjeta eliminada correctamente');
            this.ngOnInit();
          }
        });
      }
    }
    
  }


}
