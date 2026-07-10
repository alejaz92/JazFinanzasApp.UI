import { Component, OnDestroy } from '@angular/core';
import { CardAddRequest } from '../models/card-add-request.model';
import { CardService } from '../services/card.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
    selector: 'app-card-add',
    templateUrl: './card-add.component.html',
    styleUrls: ['./card-add.component.css'],
    imports: [FormsModule, BackButtonComponent]
})
export class CardAddComponent implements OnDestroy {

  model: CardAddRequest;
  private addCardSubscription?: Subscription;

  constructor(private cardService: CardService,
    private router: Router,
    private toastService: ToastService)
  {
    this.model = {
      name: ''
    };
  }


  onFormSubmit() {
    this.addCardSubscription = this.cardService.addCard(this.model)
      .subscribe({
        next: (response) => {
          this.toastService.success('Tarjeta creada correctamente');
          this.router.navigate(['/management/card']);
        },
        error: (error) => {
          this.toastService.error('Error al crear la tarjeta');
        }
      })
  }

  ngOnDestroy(): void {
    this.addCardSubscription?.unsubscribe();
  }
}