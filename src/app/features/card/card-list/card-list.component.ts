import { Component, OnInit, ViewChild } from '@angular/core';
import { CardService } from '../services/card.service';
import { Card } from '../models/card.model';
import { Observable } from 'rxjs';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-card-list',
    templateUrl: './card-list.component.html',
    styleUrls: ['./card-list.component.css'],
    imports: [LoadingComponent, NgIf, RouterLink, NgFor, FormsModule, ConfirmModalComponent]
})
export class CardListComponent implements OnInit {
  isLoading: boolean = true;
  cards: any[] | null = null;
  searchTerm: string = '';

  @ViewChild('deleteModal') deleteModal!: ConfirmModalComponent;
  private cardIdToDelete: number | null = null;

  constructor(private cardService: CardService, private toastService: ToastService) {

  }
  ngOnInit(): void {
    this.cardService.getAllCards().subscribe((response) => {
      this.cards = response;
      this.isLoading = false;
    });
  }

  get filteredCards(): any[] {
    if (!this.cards) return [];
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.cards;
    return this.cards.filter(card => card.name.toLowerCase().includes(term));
  }

  onDelete(cardId: number): void {
    if (!cardId) return;
    this.cardIdToDelete = cardId;
    this.deleteModal.open();
  }

  onDeleteConfirmed(): void {
    if (!this.cardIdToDelete) return;

    this.cardService.deleteCard(this.cardIdToDelete)
      .subscribe({
        next: (response) => {
          this.toastService.success('Tarjeta eliminada correctamente');
          this.ngOnInit();
        },
        error: (error) => {
          if (error.error == 'Card is used in transactions') {
            this.toastService.error('No se puede eliminar la tarjeta porque fue utilizada en transacciones');
          }
        }
      });

    this.cardIdToDelete = null;
  }

}
