import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AccountService } from 'src/app/features/account/services/account.service';
import { CardService } from 'src/app/features/card/services/card.service';
import { CardMovementsService } from '../../services/card-movements.service';
import { CardMovementPaymentList } from '../../models/CardMovementPayment-List.model';
import { MovementClassService } from 'src/app/features/movementClass/services/movement-class.service';
import { AssetService } from 'src/app/features/asset/services/asset.service';
import { TmplAstVariable } from '@angular/compiler';

@Component({
  selector: 'app-card-movements-pay',
  templateUrl: './card-movements-pay.component.html',
  styleUrls: ['./card-movements-pay.component.css']
})
export class CardMovementsPayComponent implements OnInit {
  cardPaymentForm!: FormGroup;
  cards: any[] = [];
  accounts: any[] = [];
  movementClasses: any[] = [];
  assets: any[] = [];
  cardMovements: CardMovementPaymentList[] = [];
  selectedPaymentAssets: string | null = null;
  successMessage: string = '';
  tableLength: number = 0;
  originalTableLength: number = 0;

  constructor(
    private fb: FormBuilder,
    private cardService: CardService,
    private accountService: AccountService,
    private assetService: AssetService,
    private movementClassService: MovementClassService,
    private cardMovementService: CardMovementsService
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
    this.loadAssets();
    this.loadMovementClasses();
    

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

  loadAssets() {
    this.assetService.getCardAssets().subscribe((data: any) => {
      this.assets = data;
    });
  }

  loadMovementClasses() {
    this.movementClassService.getAllMovementClasses().subscribe((data: any) => {

      this.movementClasses = data.filter((movementClass: any) => movementClass.incExp === 'E');
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

    this.cardMovementsArray.clear();
    

    if (card && paymentMonth) {
      this.cardMovementService.getPaymentCardMovements(card, paymentMonth).subscribe((data: CardMovementPaymentList[]) => {
        


        this.cardMovements = data;

        this.originalTableLength = this.tableLength = this.cardMovements.length;

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
        isManual: false,
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

    this.refreshCurrencyFormat();
  }

  // Método para actualizar el formato
refreshCurrencyFormat() {
  setTimeout(() => {
    this.cardMovementsArray.controls.forEach((control) => {
      control.get('installmentAmount')?.updateValueAndValidity();
      control.get('valueInPesos')?.updateValueAndValidity();
    });
  }, 0);
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
            total += parseFloat(control.get('valueInPesos')?.value);
          } else if (paymentAssets === 'Pesos+Dolar') {
            if(control.get('asset')?.value === 'Peso Argentino'){
              total += parseFloat(control.get('installmentAmount')?.value);
            }
          }
        }
      });

      if(total > pesosPayment){
        this.cardPaymentForm.get('cardExpenses')?.setValue('Datos Incorrectos');
        return;
      }

      var cardExpenses = pesosPayment - total;
      
      cardExpenses = Math.round(cardExpenses * 100) / 100;

      this.cardPaymentForm.get('cardExpenses')?.setValue(cardExpenses);
      
    }   
  }

  addManualEntry() {
    // Chequear si la tabla tiene valores previamente
    if (this.cardMovementsArray.length === 0) {
      alert("La tabla está vacía. Debes tener al menos una fila existente antes de agregar una manual.");
      return;
    }


    const manualEntry = this.fb.group({
      date: [''],
      movementClassId: [''],
      movementClass: [''],
      detail: [''],
      assetId: [''],
      asset: [''],
      installment: ['1/1'],        
      installmentAmount: [''],
      valueInPesos: [''],
      pay: true,
      isManual: true

    })

    this.cardMovementsArray.push(manualEntry);
    this.tableLength = this.cardMovementsArray.length;

    this.updateEditOptions();
  }

  //remove last manual entry
  removeManualEntry() {


    if (this.tableLength === this.originalTableLength) {
      alert("No hay filas manuales para eliminar.");
      return;
    }

    const lastManualEntry = this.cardMovementsArray.controls[this.cardMovementsArray.length - 1];
    if (lastManualEntry.get('isManual')?.value) {
      this.cardMovementsArray.removeAt(this.cardMovementsArray.length - 1);
      this.tableLength = this.cardMovementsArray.length;
    } else {
      alert("La última fila no es una fila manual.");
    }
  }
 

  isRowIncomplete(row: FormGroup): boolean {
    // Verificar si la fila tiene todos los campos requeridos, sin tener en cuenta las filas con input deshabilitados

    

    var result = !row.get('date')?.value || !row.get('movementClassId')?.value || !row.get('detail')?.value || !row.get('assetId')?.value;
    
    if(result) {
      return result;
    }

    if (this.selectedPaymentAssets === 'Pesos') {
      result = !row.get('valueInPesos')?.value;
    } else if (this.selectedPaymentAssets === 'Pesos+Dolar') {
      result = !row.get('installmentAmount')?.value;
    }
    
    return result;
  
  }


  getTotalValues() {
    let totalPesos = 0;
    let totalDollars = 0;

    this.cardMovementsArray.controls.forEach((control) => {
      if (control.get('pay')?.value) {
        if (this.selectedPaymentAssets === 'Pesos') {
          totalPesos += parseFloat(control.get('valueInPesos')?.value);
        } else if (this.selectedPaymentAssets === 'Pesos+Dolar') {
          if (control.get('asset')?.value === 'Peso Argentino') {
            totalPesos += parseFloat(control.get('installmentAmount')?.value);
          }
          else {
            totalDollars += parseFloat(control.get('installmentAmount')?.value);
          }          
        }

      }
    });

    return {
      totalPesos,
      totalDollars
    };
  }

  onSubmit() {

    // if (this.cardPaymentForm.invalid) {
    //   alert('Datos incorrectos');
    //   return;
    // }

    const formValues = this.cardPaymentForm.value;

    if (formValues.card === '') {
      this.cardPaymentForm.controls['card'].setErrors({ 'incorrect': true });
      return;
    }

    if (formValues.paymentMonth === '') {
      this.cardPaymentForm.controls['paymentMonth'].setErrors({ 'incorrect': true });
      return;
    }

    if (formValues.date === '') {
      this.cardPaymentForm.controls['date'].setErrors({ 'incorrect': true });
      return;
    }

    if (formValues.account === '') {
      this.cardPaymentForm.controls['account'].setErrors({ 'incorrect': true });
      return;
    }

    if (formValues.paymentAssets === '') {
      this.cardPaymentForm.controls['paymentAssets'].setErrors({ 'incorrect': true });
      return;
    }

    if (formValues.pesosPayment === '' || isNaN(formValues.pesosPayment) || formValues.pesosPayment <= 0) {
      this.cardPaymentForm.controls['pesosPayment'].setErrors({ 'incorrect': true });
      return;
    }

    if (formValues.cardExpenses === '' || isNaN(formValues.cardExpenses) || formValues.cardExpenses < 0) {
      this.cardPaymentForm.controls['cardExpenses'].setErrors({ 'incorrect': true });
      return;
    }


    // check if there are any rows with missing values, except for the disabled inputs
    const incompleteRow = this.cardMovementsArray.controls.find((control) => this.isRowIncomplete(control as FormGroup));
    if (incompleteRow) {
      alert("Hay filas incompletas. Por favor, completa todos los campos antes de continuar.");
      return;
    }
    



    const cardMovements = this.cardMovementsArray.controls
      .filter(control => control.get('pay')?.value)
      .map(control => ({
        date: control.get('date')?.value,
        movementClassId: parseInt(control.get('movementClassId')?.value),
        detail: control.get('detail')?.value,
        assetId: parseInt(control.get('assetId')?.value),
        installment: control.get('installment')?.value,
        installmentAmount: parseFloat(control.get('installmentAmount')?.value) | 0,
        valueInPesos: parseFloat(control.get('valueInPesos')?.value) | 0
      }));

      const cardPaymentRequest = {
        cardId: parseInt(this.cardPaymentForm.get('card')?.value),
        paymentMonth: this.cardPaymentForm.get('paymentMonth')?.value + '-01',
        paymentDate: this.cardPaymentForm.get('date')?.value,
        accountId: parseInt(this.cardPaymentForm.get('account')?.value),
        paymentAsset: this.cardPaymentForm.get('paymentAssets')?.value,
        pesosAmount: parseFloat(this.cardPaymentForm.get('pesosPayment')?.value),
        dolarAmount: 0,
        cardExpenses: parseFloat(this.cardPaymentForm.get('cardExpenses')?.value),
        cardMovements: cardMovements        
      }

      if (cardPaymentRequest.paymentAsset === 'Pesos+Dolar') {
        cardPaymentRequest.paymentAsset = 'P+D';
      } else if (cardPaymentRequest.paymentAsset === 'Pesos') {
        cardPaymentRequest.paymentAsset = 'P';
      }


      //console.log(cardPaymentRequest);
      this.cardMovementService.createCardPayment(cardPaymentRequest).subscribe(() => {
        
        this.cardPaymentForm.reset();
        this.cardMovementsArray.clear();

        this.successMessage = 'Movimiento creado con éxito';
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      });

  }
}
