import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MovementRefund } from '../models/movement-refund.model';
import { Movement } from '../models/movement.model';
import { ActivatedRoute, Router } from '@angular/router';
import { MovementService } from '../services/movement.service';
import { AccountService } from '../../account/services/account.service';

@Component({
  selector: 'app-movement-refund',
  templateUrl: './movement-refund.component.html',
  styleUrls: ['./movement-refund.component.css']
})
export class MovementRefundComponent implements OnInit, OnDestroy {
  refundForm!: FormGroup;
  id: string | null = null;
  paramsSubscription?: Subscription;
  refundSubscription?: Subscription;
  refund?: MovementRefund;
  movement?: Movement;
  successMessage: string = '';
  accounts: any[] = []; 
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute, 
    private movementService: MovementService, 
    private accountService: AccountService,
    private router: Router) { }

  ngOnInit(): void {
    this.refundForm = this.fb.group({
      accountId: [null, Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      date: [{ value: '', disabled: false }] // Permite que la fecha sea editable
    });

    this.loadAccounts();

    this.paramsSubscription = this.route.paramMap.subscribe({
      next: (params) => {        
        this.id = params.get('id');        
        if (this.id) {
          this.movementService.getMovementById(Number(this.id)).subscribe({
            next: (response) => {
              this.movement = response;

              this.refundForm.patchValue({ // Actualiza el formulario
                accountId: this.movement.accountId,
                date: this.movement.date ? new Date(this.movement.date).toISOString().split('T')[0] : '', // Asegúrate de que se formatee correctamente
              });
            }
          });
        } 
      }
    });
  }

  loadAccounts() {
    this.accountService.getAccountByTypeName("Moneda").subscribe((data: any) => {
      this.accounts = data;
    });
  }
  
  onFormSubmit(): void {

    if(this.refundForm.invalid) {
      return;
    } 

    const formValues = this.refundForm.value;
    let oldValue = this.movement?.amount;
    if (oldValue === undefined) {
      oldValue = 0;
    }
    oldValue = Math.abs(oldValue);
    
    if (isNaN(formValues.amount) || formValues.amount <= 0) {
      this.refundForm.controls['amount'].setErrors({ 'incorrect': true });
      return;
    }
    

    if (formValues.amount > oldValue) {
      return;
    }
    
    this.refund = {
      accountId: formValues.accountId,
      amount: formValues.amount,
      date: formValues.date
    };
      

    if (this.id && this.refund) {  
      
      this.refundSubscription = this.movementService.refundMovement(Number(this.id), this.refund).subscribe({
        next: (response) => {
          this.successMessage = 'Reembolso realizado con éxito';
          setTimeout(() => {
            this.router.navigate(['/movements']);
          }, 2000);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.paramsSubscription?.unsubscribe();
    this.refundSubscription?.unsubscribe();
  }

  selectAll(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.select();
  }
}
