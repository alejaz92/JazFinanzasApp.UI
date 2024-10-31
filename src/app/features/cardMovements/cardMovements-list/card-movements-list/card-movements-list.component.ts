import { Component, OnInit } from '@angular/core';
import { CardMovementPending } from '../../models/cardMovements-pending.model';
import { CardMovementsService } from '../../services/card-movements.service';

@Component({
  selector: 'app-card-movements-list',
  templateUrl: './card-movements-list.component.html',
  styleUrls: ['./card-movements-list.component.css']
})
export class CardMovementsListComponent implements OnInit {
  cardMovements: CardMovementPending[] = [];


  constructor(private cardMovementeService: CardMovementsService) { }

  ngOnInit(): void {

    this.loadCardMovements();
  }

  loadCardMovements() {
    
    this.cardMovementeService.getPendingCardMovements()
      .subscribe(response => {
        this.cardMovements = response;
      });
  }

}
