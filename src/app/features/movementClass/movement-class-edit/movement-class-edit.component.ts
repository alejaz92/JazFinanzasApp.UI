import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MovementClass } from '../models/movementClass.model';
import { ActivatedRoute, Router } from '@angular/router';
import { MovementClassService } from '../services/movement-class.service';

@Component({
  selector: 'app-movement-class-edit',
  templateUrl: './movement-class-edit.component.html',
  styleUrls: ['./movement-class-edit.component.css']
})
export class MovementClassEditComponent implements OnInit, OnDestroy{
  id: string | null = null;
  paramsSubcription?: Subscription;
  editMovementClassSubscription?: Subscription;
  movementClass?: MovementClass;

  constructor(private route: ActivatedRoute, private movementClassService: MovementClassService, private router: Router) {  }

  ngOnInit(): void {
    this.paramsSubcription = this.route.paramMap.subscribe({
      next: (params) => {
        this.id = params.get('id');

        if (this.id) {
          // Get data from server
          this.movementClassService.getMovementClassById(Number(this.id)).subscribe({
            next: (response) => {
              this.movementClass = response;
            }
          });
        } 
      }
    });
  }

  onFormSubmit(): void {
    const movementClassUpdateRequest: MovementClass = {
      incExp: this.movementClass?.incExp ?? '',
      id: this.movementClass?.id ?? 0,
      description: this.movementClass?.description ?? ''
    };

    if (this.id) {
      this.editMovementClassSubscription = this.movementClassService.updateMovementClass(Number(this.id), movementClassUpdateRequest).subscribe({
        next: (response) => {
          this.router.navigateByUrl('/management/movementClass');
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.paramsSubcription?.unsubscribe();
    this.editMovementClassSubscription?.unsubscribe();
  }

}
