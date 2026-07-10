import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Trip } from '../models/trip.model';
import { TripRequest } from '../models/trip-request.model';
import { TripService } from '../services/trip.service';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
    selector: 'app-trip-edit',
    templateUrl: './trip-edit.component.html',
    imports: [LoadingComponent, NgIf, FormsModule, BackButtonComponent]
})
export class TripEditComponent implements OnInit, OnDestroy {
  isLoading: boolean = true;
  id: string | null = null;
  model?: TripRequest;
  private paramsSubscription?: Subscription;
  private editSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private tripService: TripService,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.paramsSubscription = this.route.paramMap.subscribe({
      next: (params) => {
        this.id = params.get('id');
        if (this.id) {
          this.tripService.getTripById(Number(this.id)).subscribe({
            next: (response: Trip) => {
              this.model = {
                name: response.name,
                type: response.type,
                startDate: response.startDate.substring(0, 10),
                endDate: response.endDate.substring(0, 10)
              };
              this.isLoading = false;
            },
            error: () => {
              this.toastService.error('Error al cargar el viaje');
              this.isLoading = false;
            }
          });
        }
      }
    });
  }

  onFormSubmit(): void {
    if (!this.id || !this.model) return;

    this.editSubscription = this.tripService.updateTrip(Number(this.id), this.model).subscribe({
      next: () => {
        this.toastService.success('Viaje actualizado correctamente');
        this.router.navigate(['/management/trips']);
      },
      error: (error) => {
        this.toastService.error(error.error?.message ?? 'Error al actualizar el viaje');
      }
    });
  }

  ngOnDestroy(): void {
    this.paramsSubscription?.unsubscribe();
    this.editSubscription?.unsubscribe();
  }
}
