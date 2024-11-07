import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AccountService } from 'src/app/features/account/services/account.service';
import { CardService } from 'src/app/features/card/services/card.service';
import { CardMovementsService } from '../../services/card-movements.service';
import { CardMovementPaymentList } from '../../models/CardMovementPayment-List.model';

@Component({
  selector: 'app-card-movements-pay',
  templateUrl: './card-movements-pay.component.html',
  styleUrls: ['./card-movements-pay.component.css']
})
export class CardMovementsPayComponent implements OnInit {
  cardPaymentForm!: FormGroup;
  cards: any[] = [];
  accounts: any[] = [];
  cardMovements: CardMovementPaymentList[] = [];
  selectedPaymentAssets: string | null = null;

  constructor(
    private fb: FormBuilder,
    private cardService: CardService,
    private accountService: AccountService,
    private cardMovementService: CardMovementsService,
  ) { }

  get cardMovementsArray(): FormArray {
    return this.cardPaymentForm.get('cardMovementsArray') as FormArray;
  }

  ngOnInit(): void {  
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const formattedMonth = month === 0 ? `${year - 1}-12` : `${year}-${month < 10 ? '0' + month : month}`;

    this.cardPaymentForm = this.fb.group({
      card: ['', Validators.required],
      paymentMonth: [formattedMonth, Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      account: ['', Validators.required],
      paymentAssets: ['', Validators.required],
      pesosPayment: ['', Validators.required],
      cardExpenses: [''],
      cardMovementsArray: this.fb.array([]) 
    });


    this.loadCards();
    this.loadAccounts();
    

    this.cardPaymentForm.get('card')?.valueChanges.subscribe(() =>  this.loadTable());
    this.cardPaymentForm.get('paymentMonth')?.valueChanges.subscribe(() => this.loadTable());
    this.cardPaymentForm.get('paymentAssets')?.valueChanges.subscribe((value) => {
      this.selectedPaymentAssets = value;
      this.updateEditOptions();
    });
    this.cardPaymentForm.get('pesosPayment')?.valueChanges.subscribe(() => this.updateCardExpenses());
    this.cardPaymentForm.get('cardMovementsArray')?.valueChanges.subscribe(() => this.updateCardExpenses());    
  }

  loadCards() {
    this.cardService.getAllCards().subscribe((data: any) => {
      this.cards = data;
    });
  }

  loadAccounts() {
    this.accountService.getAccountByTypeName("Moneda").subscribe((data: any) => {
      this.accounts = data;
    });
  }

  loadTable() {
    const card = this.cardPaymentForm.get('card')?.value;
    const paymentMonth = this.cardPaymentForm.get('paymentMonth')?.value;

    

    if (card && paymentMonth) {
      this.cardMovementService.getPaymentCardMovements(card, paymentMonth).subscribe((data: CardMovementPaymentList[]) => {
        
        this.cardMovements = data;
        this.populateCardMovementsArray(this.cardMovements);

        if (this.selectedPaymentAssets) {
          this.updateEditOptions();
        }
        
      });
    }
  }

  populateCardMovementsArray(cardMovements: CardMovementPaymentList[]) {
    const cardMovementsArray = this.cardMovementsArray;
    cardMovementsArray.clear();

    
    cardMovements.forEach(movement => {


      const movementGroup = this.fb.group({
        date: [movement.date],
        movementClassId: [movement.movementClassId],
        movementClass: [movement.movementClass],
        detail: [movement.detail],
        assetId: [movement.assetId],
        asset: [movement.asset],
        installment: [movement.installment],        
        installmentAmount: [{ value: movement.installmentAmount, disabled: true }],
        valueInPesos: [{ value: movement.valueInPesos, disabled: true }],
        pay: true,
        originalInstallmentAmount: [movement.installmentAmount],
        originalValueInPesos: [movement.valueInPesos]
      });    


      cardMovementsArray.push(movementGroup);


    });
  }


  updateEditOptions() {
    const paymentAssets = this.selectedPaymentAssets;

    this.cardMovementsArray.controls.forEach((control) => {
      if (paymentAssets === 'Pesos') {
        control.get('valueInPesos')?.enable();
        control.get('installmentAmount')?.disable();

        const originalInstallmentAmount = control.get('originalInstallmentAmount')?.value;
        control.get('installmentAmount')?.setValue(originalInstallmentAmount);
      } else if (paymentAssets === 'Pesos+Dolar') {
        control.get('valueInPesos')?.disable();
        control.get('installmentAmount')?.enable();

        const originalValueInPesos = control.get('originalValueInPesos')?.value;
        control.get('valueInPesos')?.setValue(originalValueInPesos);
      } else {
        control.get('valueInPesos')?.disable();
        control.get('installmentAmount')?.disable();

        const originalInstallmentAmount = control.get('originalInstallmentAmount')?.value;
        const originalValueInPesos = control.get('originalValueInPesos')?.value;

        control.get('installmentAmount')?.setValue(originalInstallmentAmount);
        control.get('valueInPesos')?.setValue(originalValueInPesos);
      }
    });
  }

  updateCardExpenses() {
    const pesosPayment = this.cardPaymentForm.get('pesosPayment')?.value;
    const paymentAssets = this.selectedPaymentAssets;

    if (pesosPayment != '' && paymentAssets != null) {
      
      const cardMovementsArray = this.cardMovementsArray;

      //recorrer cardMovementsArray y sumar installmentamount
      let total = 0;
      cardMovementsArray.controls.forEach((control) => {
        if (control.get('pay')?.value) {
          if (paymentAssets === 'Pesos') {
            total += control.get('valueInPesos')?.value;
          } else if (paymentAssets === 'Pesos+Dolar') {
            if(control.get('asset')?.value === 'Peso Argentino'){
              total += control.get('installmentAmount')?.value;
            }
          }
        }
      });

      if(total > pesosPayment){
        this.cardPaymentForm.get('cardExpenses')?.setValue('Datos Incorrectos');
        return;
      }

      this.cardPaymentForm.get('cardExpenses')?.setValue(pesosPayment - total);
      
    }   
  }

  onSubmit() {
    // Implementar lógica de envío
    console.log(this.cardPaymentForm.value);
  }
}
