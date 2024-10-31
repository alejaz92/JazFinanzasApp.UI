import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MovementService } from '../services/movement.service';
import { HttpClient } from '@angular/common/http';
import { AccountService } from '../../account/services/account.service';
import { AssetService } from '../../asset/services/asset.service';
import { MovementClassService } from '../../movementClass/services/movement-class.service';


@Component({
  selector: 'app-movement-add',
  templateUrl: './movement-add.component.html',
  styleUrls: ['./movement-add.component.css']
})
export class MovementAddComponent implements OnInit{
  movementForm!: FormGroup;
  selectedMovementType: string = '';
  accounts: any[] = [];
  incomeClasses: any[] = [];
  expenseClasses: any[] = [];
  assets: any[] = [];
  formattedAmount: string = '';
  successMessage: string = '';


  constructor(
    private fb: FormBuilder,
    private movementService: MovementService, 
    private accountService: AccountService,
    private assetService: AssetService,
    private movementClasses: MovementClassService,
    private http: HttpClient) { }

    ngOnInit(): void {
      this.movementForm = this.fb.group({
        movementType: ['', Validators.required],
        date: ['', Validators.required],
        asset: ['', Validators.required],
        amount: ['', Validators.required],
        detail: [''],
        incomeAccount: [''],
        expenseAccount: [''],
        incomeClass: [''],
        expenseClass: [''],
        incomeExchangeAccount: [''],
        expenseExchangeAccount: [''],
      
      });

      this.loadAccounts();
      this.loadAssets();
      this.loadMovementClasses();
    }

    loadAccounts() {
      this.accountService.getAccountByTypeName("Moneda").subscribe((data: any) => {
        this.accounts = data;
      });
    }

    loadAssets() {
      this.assetService.getAssetsByTypeName("Moneda").subscribe((data: any) => {
        
        this.assets = data;
        
      });
    }

    loadMovementClasses() {
      this.movementClasses.getAllMovementClasses().subscribe((data: any) => {
        this.incomeClasses = data.filter((x: any) => x.incExp === 'I');
        this.expenseClasses = data.filter((x: any) => x.incExp === 'E');
      });
    }

    onSubmit() {
      const formValues = this.movementForm.value;
      
      if(formValues.movementType === '') {
        this.movementForm.controls['movementType'].setErrors({ 'incorrect': true });
        return;
      }

      
      if(formValues.date === '') {
        this.movementForm.controls['date'].setErrors({ 'incorrect': true });
        return;
      }

      if(formValues.asset === '') {
        this.movementForm.controls['asset'].setErrors({ 'incorrect': true });
        return;
      }

      if (formValues.movementType === 'I') {
        if(formValues.incomeAccount === '') {
          this.movementForm.controls['incomeAccount'].setErrors({ 'incorrect': true });
          return;
        }
        if(formValues.incomeClass === '') {
          this.movementForm.controls['incomeClass'].setErrors({ 'incorrect': true });
          return;
        }

      }
      if (formValues.movementType === 'E') {
        if(formValues.expenseAccount === '') {
          this.movementForm.controls['expenseAccount'].setErrors({ 'incorrect': true });
          return;
        }
        if(formValues.expenseClass === '') {
          this.movementForm.controls['expenseClass'].setErrors({ 'incorrect': true });
          return;
        }
      }
      if (formValues.movementType === 'EX') {
        if(formValues.incomeExchangeAccount === '') {
          this.movementForm.controls['incomeExchangeAccount'].setErrors({ 'incorrect': true });
          return;
        }
        if(formValues.expenseExchangeAccount === '') {
          this.movementForm.controls['expenseExchangeAccount'].setErrors({ 'incorrect': true });
          return;
        }
      }


      if(isNaN(formValues.amount) || formValues.amount <= 0) {
        this.movementForm.controls['amount'].setErrors({ 'incorrect': true });
        return;
      }

      //mapeo de los valores del formulario para el dto
      const movementAdd = {
        incomeAccountId: formValues.movementType === "I" ? parseInt(formValues.incomeAccount) : 
          formValues.movementType === "EX" ? parseInt(formValues.incomeExchangeAccount) : null,
        expenseAccountId: formValues.movementType === "E" ? parseInt(formValues.expenseAccount) : 
          formValues.movementType === "EX" ? parseInt(formValues.expenseExchangeAccount) : null,
        assetId: parseInt(formValues.asset),
        date: formValues.date,
        movementType: formValues.movementType,
        movementClassId: formValues.movementType === 'I' 
        ? (formValues.incomeClass ? parseInt(formValues.incomeClass, 10) : null)
        : (formValues.expenseClass ? parseInt(formValues.expenseClass, 10) : null),
        detail: formValues.detail,
        amount: Number(formValues.amount),
        quotePrice: 0
      }

      if (this.movementForm.invalid) {
        return;
      }

      this.movementService.createMovement(movementAdd).subscribe(() => {
      
       this.movementForm.reset();
       this.successMessage = 'Movimiento creado con éxito';

       setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      });
    }

    onMovementTypeChange(event: any) {
      this.selectedMovementType = event.target.value;
    }  
}
