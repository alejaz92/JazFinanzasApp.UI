import { Component, OnDestroy } from '@angular/core';
import { MovementClassAddRequest } from '../models/movementClass-addRequest.model';
import { Subscription } from 'rxjs';
import { MovementClassService } from '../services/movement-class.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-movement-class-add',
  templateUrl: './movement-class-add.component.html',
  styleUrls: ['./movement-class-add.component.css']
})
export class MovementClassAddComponent implements OnDestroy{
  model: MovementClassAddRequest;
  private addMovementClassSubscription?: Subscription;

  constructor(private movementClassService: MovementClassService, private router: Router) {
    this.model = {
      description: '',
      incExp: ''
    };
  }

  onFormSubmit() {
    this.addMovementClassSubscription = this.movementClassService.addMovementClass(this.model)
      .subscribe({
        next: (response) => {
          this.router.navigate(['/management/movementClass']);
        }
      })
  }

  ngOnDestroy(): void {
    this.addMovementClassSubscription?.unsubscribe();
  }
}
