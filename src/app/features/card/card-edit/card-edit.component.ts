import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CardService } from '../services/card.service';
import { Card } from '../models/card.model';
import { CardUpdateRequest } from '../models/card-update-request.model';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
    selector: 'app-card-edit',
    templateUrl: './card-edit.component.html',
    styleUrls: ['./card-edit.component.css'],
    imports: [LoadingComponent, NgIf, FormsModule, BackButtonComponent]
})
export class CardEditComponent implements OnInit, OnDestroy {
  isLoading: boolean = true;
  id: string | null = null;
  paramsSubcription?: Subscription;
  editCardSubscription?: Subscription;
  card?: Card;

  constructor(private route: ActivatedRoute, private cardService: CardService, private router: Router, private toastService: ToastService) {  }

  ngOnInit(): void {
    this.paramsSubcription = this.route.paramMap.subscribe({
      next: (params) => {
        this.id = params.get('id');

        if (this.id) {
          // Get data from server
          this.cardService.getCardById(Number(this.id)).subscribe({
            next: (response) => {
              this.card = response;
              this.isLoading = false;
            },
            error: (error) => {
              this.toastService.error('Error al cargar la tarjeta');
              this.isLoading = false;
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
          this.toastService.success('Tarjeta actualizada correctamente');
          this.router.navigateByUrl('/management/card');
        },
        error: (error) => {
          this.toastService.error('Error al actualizar la tarjeta');
        }
      });
    }


  }


  ngOnDestroy(): void {
    this.paramsSubcription?.unsubscribe();
    this.editCardSubscription?.unsubscribe();
  };

}
