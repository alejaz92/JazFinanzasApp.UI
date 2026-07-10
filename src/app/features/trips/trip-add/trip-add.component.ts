import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TripRequest } from '../models/trip-request.model';
import { TripService } from '../services/trip.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
    selector: 'app-trip-add',
    templateUrl: './trip-add.component.html',
    imports: [FormsModule, BackButtonComponent]
})
export class TripAddComponent implements OnDestroy {
  model: TripRequest;
  private addSubscription?: Subscription;

  constructor(
    private tripService: TripService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.model = { name: '', type: 'DOMESTIC', startDate: '', endDate: '' };
  }

  onFormSubmit(): void {
    this.addSubscription = this.tripService.addTrip(this.model).subscribe({
      next: () => {
        this.toastService.success('Viaje agregado correctamente');
        this.router.navigate(['/management/trips']);
      },
      error: (error) => {
        this.toastService.error(error.error?.message ?? 'Error al agregar el viaje');
      }
    });
  }

  ngOnDestroy(): void {
    this.addSubscription?.unsubscribe();
  }
}
