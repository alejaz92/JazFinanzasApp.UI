import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AccountService } from 'src/app/features/account/services/account.service';
import { CardService } from 'src/app/features/card/services/card.service';
import { CardTransactionsService } from '../services/card-transactions.service';
import { CardTransactionPaymentList } from '../models/CardTransactionPayment-List.model';
import { TransactionClassService } from 'src/app/features/transactionClass/services/transaction-class.service';
import { AssetService } from 'src/app/features/asset/services/asset.service';
import { TmplAstVariable } from '@angular/compiler';
import { SharedExpenseService } from 'src/app/features/shared-expenses/services/shared-expense.service';
import { CardTransactionDiscountService } from 'src/app/features/card-transaction-discount/services/card-transaction-discount.service';
import { CardPendingCredit } from 'src/app/features/card-transaction-discount/models/card-transaction-discount.model';
import { catchError, merge, of, switchMap } from 'rxjs';
import { LoadingComponent } from '../../../core/components/loading/loading.component';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { CurrencyInputDirective } from '../../../shared/directives/currency-input.directive';
import { CurrencyFiatFormatPipe } from '../../../shared/pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { ToastService } from '../../../core/services/toast.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
    selector: 'app-card-transactions-pay',
    templateUrl: './card-transactions-pay.component.html',
    styleUrls: ['./card-transactions-pay.component.css'],
    imports: [LoadingComponent, NgIf, FormsModule, ReactiveFormsModule, NgFor, CurrencyInputDirective, BackButtonComponent, DatePipe, CurrencyFiatFormatPipe]
})
export class CardTransactionsPayComponent implements OnInit {
  isLoading: boolean = true;
  cardPaymentForm!: FormGroup;
  cards: any[] = [];
  accounts: any[] = [];
  transactionClasses: any[] = [];
  assets: any[] = [];
  cardTransactions: CardTransactionPaymentList[] = [];
  selectedPaymentAssets: string | null = null;
  tableLength: number = 0;
  originalTableLength: number = 0;
  reimbursementsPreview: number = 0;
  cardPendingCredit: CardPendingCredit | null = null;
  creditManuallyEdited: boolean = false;

  constructor(
    private fb: FormBuilder,
    private cardService: CardService,
    private accountService: AccountService,
    private assetService: AssetService,
    private transactionClassService: TransactionClassService,
    private cardTransactionService: CardTransactionsService,
    private sharedExpenseService: SharedExpenseService,
    private cardTransactionDiscountService: CardTransactionDiscountService,
    private toastService: ToastService
  ) { }

  get cardTransactionsArray(): FormArray {
    return this.cardPaymentForm.get('cardTransactionsArray') as FormArray;
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
      cardCreditApplied: [0],
      nextClosingDate: [''],
      nextDueDate: [''],
      cardTransactionsArray: this.fb.array([])
    });


    this.loadCards();
    this.loadAccounts();
    this.loadAssets();
    this.loadTransactionClasses();
    

    // switchMap cancela la consulta anterior si card/paymentMonth cambian antes de que responda,
    // evitando que una respuesta vieja pise la tabla con datos de otra cuota/mes.
    merge(
      this.cardPaymentForm.get('card')!.valueChanges,
      this.cardPaymentForm.get('paymentMonth')!.valueChanges
    ).pipe(
      switchMap(() => {
        const card = this.cardPaymentForm.get('card')?.value;
        const paymentMonth = this.cardPaymentForm.get('paymentMonth')?.value;

        this.cardTransactionsArray.clear();

        return card && paymentMonth
          ? this.cardTransactionService.getPaymentCardTransactions(card, paymentMonth).pipe(
              catchError(() => of(null))
            )
          : of(null);
      })
    ).subscribe((data) => {
      if (!data) return;

      this.cardTransactions = data;
      this.originalTableLength = this.tableLength = this.cardTransactions.length;
      this.populateCardTransactionsArray(this.cardTransactions);

      if (this.selectedPaymentAssets) {
        this.updateEditOptions();
      }

      this.loadReimbursementsPreview(this.cardTransactions);
    });

    this.cardPaymentForm.get('paymentAssets')?.valueChanges.subscribe((value) => {
      this.selectedPaymentAssets = value;
      this.updateEditOptions();
    });
    // El saldo a favor es de la tarjeta, no del mes: se recarga solo al cambiar de tarjeta.
    this.cardPaymentForm.get('card')!.valueChanges.subscribe((cardId) => {
      this.cardPendingCredit = null;
      this.cardPaymentForm.get('cardCreditApplied')?.setValue(0, { emitEvent: false });
      if (!cardId) return;

      this.cardTransactionDiscountService.getPendingCredit(cardId).subscribe({
        next: (credit) => {
          this.cardPendingCredit = credit;
          this.creditManuallyEdited = false;
          this.updateCardExpenses();
        },
        error: () => { this.cardPendingCredit = null; }
      });
    });

    this.cardPaymentForm.get('cardCreditApplied')?.valueChanges.subscribe(() => this.updateCardExpenses());
    this.cardPaymentForm.get('pesosPayment')?.valueChanges.subscribe(() => this.updateCardExpenses());
    this.cardPaymentForm.get('cardTransactionsArray')?.valueChanges.subscribe(() => this.updateCardExpenses());    
  }

  loadCards() {
    this.cardService.getAllCards().subscribe((data: any) => {
      this.cards = data;

      this.isLoading = false;
    });
  }

  loadAssets() {
    this.assetService.getCardAssets().subscribe((data: any) => {
      this.assets = data;
    });
  }

  loadTransactionClasses() {
    this.transactionClassService.getAllTransactionClasses().subscribe((data: any) => {

      this.transactionClasses = data.filter((transactionClass: any) => transactionClass.incExp === 'E');
    });
  }

  loadAccounts() {
    this.accountService.getAccountByTypeName("Moneda").subscribe((data: any) => {
      this.accounts = data;
    });
  }

  private loadReimbursementsPreview(transactions: CardTransactionPaymentList[]): void {
    this.reimbursementsPreview = 0;

    transactions
      .filter(t => t.cardTransactionId)
      .forEach(t => {
        this.sharedExpenseService.getByCardTransactionId(t.cardTransactionId).subscribe({
          next: (detail) => {
            const applicable = detail.splits.reduce((sum, s) => {
              const available = s.amountReimbursed - (s.amountApplied || 0);
              const installmentCap = s.installmentSplitAmount || 0;
              const toApply = Math.min(Math.max(available, 0), installmentCap);
              return sum + toApply;
            }, 0);
            this.reimbursementsPreview = Math.round((this.reimbursementsPreview + applicable) * 100) / 100;
          },
          error: () => { /* esta CardTransaction no tiene gasto compartido */ }
        });

        // El descuento/promoción bancaria viene pre-particionado por cuota exacta (FIFO);
        // solo cuenta lo que esté etiquetado para el installmentNumber que se está pagando ahora.
        this.cardTransactionDiscountService.getByCardTransactionId(t.cardTransactionId).subscribe({
          next: (detail) => {
            const applicable = detail.installments
              .filter(i => i.installmentNumber === t.installmentNumber)
              .reduce((sum, i) => sum + i.amount, 0);
            this.reimbursementsPreview = Math.round((this.reimbursementsPreview + applicable) * 100) / 100;
          },
          error: () => { /* esta CardTransaction no tiene descuento/promoción bancaria */ }
        });
      });
  }

  get cardCreditApplied(): number {
    const value = parseFloat(this.cardPaymentForm.get('cardCreditApplied')?.value);
    return isNaN(value) ? 0 : value;
  }

  get cardCreditAvailable(): number {
    return this.cardPendingCredit?.totalPending ?? 0;
  }

  get cardCreditRemaining(): number {
    return Math.round((this.cardCreditAvailable - this.cardCreditApplied) * 100) / 100;
  }

  onCreditManuallyChanged(): void {
    this.creditManuallyEdited = true;
    this.updateCardExpenses();
  }

  get netPesosAfterReimbursement(): number {
    const totals = this.getTotalValues();
    return Math.round((totals.totalPesos - this.reimbursementsPreview - this.cardCreditApplied) * 100) / 100;
  }

  populateCardTransactionsArray(cardTransactions: CardTransactionPaymentList[]) {
    const cardTransactionsArray = this.cardTransactionsArray;
    cardTransactionsArray.clear();

    
    cardTransactions.forEach(transaction => {


      const transactionGroup = this.fb.group({
        cardTransactionId: [transaction.cardTransactionId],
        installmentNumber: [transaction.installmentNumber],
        date: [transaction.date],
        transactionClassId: [transaction.transactionClassId],
        transactionClass: [transaction.transactionClass],
        detail: [transaction.detail],
        assetId: [transaction.assetId],
        asset: [transaction.asset],
        installment: [transaction.installment],
        installmentAmount: [{ value: transaction.installmentAmount, disabled: true }],
        valueInPesos: [{ value: transaction.valueInPesos, disabled: true }],
        pay: true,
        isManual: false,
        originalInstallmentAmount: [transaction.installmentAmount],
        originalValueInPesos: [transaction.valueInPesos]
      });


      cardTransactionsArray.push(transactionGroup);



    });
  }


  updateEditOptions() {
    const paymentAssets = this.selectedPaymentAssets;

    this.cardTransactionsArray.controls.forEach((control) => {
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
    this.cardTransactionsArray.controls.forEach((control) => {
      control.get('installmentAmount')?.updateValueAndValidity();
      control.get('valueInPesos')?.updateValueAndValidity();
    });
  }, 0);
}

  updateCardExpenses() {
    const pesosPayment = this.cardPaymentForm.get('pesosPayment')?.value;
    const paymentAssets = this.selectedPaymentAssets;

    if (pesosPayment !== '' && pesosPayment !== null && paymentAssets != null) {
      
      const cardTransactionsArray = this.cardTransactionsArray;

      //recorrer cardTransactionsArray y sumar installmentamount
      let total = 0;


      cardTransactionsArray.controls.forEach((control) => {



        if(parseInt(control.get('assetId')?.value) === 1 && control.get('asset')?.value === '') {
          control.get('asset')!.setValue('Peso Argentino');
        } else if (control.get('assetId')?.value === 2 && control.get('asset')?.value === '') {
          control.get('asset')!.setValue('Dolar Estadounidense');
        }

        if (control.get('pay')?.value) {
          if (paymentAssets === 'Pesos') {
            total += parseFloat(control.get('valueInPesos')?.value);
          } else if (paymentAssets === 'Pesos+Dolar') {
            
            if(control.get('asset')?.value === 'Peso Argentino' || control.get('assetId')?.value === 1){
             
              total += parseFloat(control.get('installmentAmount')?.value);
            }
          }
        }
      });

      // El banco aplica el saldo a favor solo, contra el total del resumen, y lo que sobra queda
      // para el mes siguiente. No es una decision del usuario, asi que se deduce en vez de pedirse:
      //   - Si pago $0, el credito cubrio el resumen entero -> se uso lo que suman las cuotas.
      //   - Si pago algo, el credito se agoto (si no, habria pagado menos) -> se uso todo el disponible.
      // Queda editable solo por el unico caso que la formula no puede separar: un resumen con credito
      // y gastos a la vez pagando $0.
      if (!this.creditManuallyEdited) {
        const disponible = this.cardCreditAvailable;
        const auto = pesosPayment > 0 ? disponible : Math.min(disponible, total);
        this.cardPaymentForm.get('cardCreditApplied')?.setValue(Math.round(auto * 100) / 100, { emitEvent: false });
      }

      const creditApplied = this.cardCreditApplied;

      if(total > pesosPayment + creditApplied){
        this.cardPaymentForm.get('cardExpenses')?.setValue('Datos Incorrectos');
        return;
      }

      var cardExpenses = pesosPayment + creditApplied - total;
      
      cardExpenses = Math.round(cardExpenses * 100) / 100;

      this.cardPaymentForm.get('cardExpenses')?.setValue(cardExpenses);
      
    }   
  }

  addManualEntry() {
    // Chequear si la tabla tiene valores previamente
    if (this.cardTransactionsArray.length === 0) {
      this.toastService.error('La tabla está vacía. Debes tener al menos una fila existente antes de agregar una manual.');
      return;
    }


    const manualEntry = this.fb.group({
      cardTransactionId: [0],
      installmentNumber: [0],
      date: [''],
      transactionClassId: [''],
      transactionClass: [''],
      detail: [''],
      assetId: [''],
      asset: [''],
      installment: ['1/1'],        
      installmentAmount: [''],
      valueInPesos: [''],
      pay: true,
      isManual: true

    })

    this.cardTransactionsArray.push(manualEntry);
    this.tableLength = this.cardTransactionsArray.length;

    this.updateEditOptions();
  }

  //remove last manual entry
  removeManualEntry() {


    if (this.tableLength === this.originalTableLength) {
      this.toastService.error('No hay filas manuales para eliminar.');
      return;
    }

    const lastManualEntry = this.cardTransactionsArray.controls[this.cardTransactionsArray.length - 1];
    if (lastManualEntry.get('isManual')?.value) {
      this.cardTransactionsArray.removeAt(this.cardTransactionsArray.length - 1);
      this.tableLength = this.cardTransactionsArray.length;
    } else {
      this.toastService.error('La última fila no es una fila manual.');
    }
  }
 

  isRowIncomplete(row: FormGroup): boolean {
    // Verificar si la fila tiene todos los campos requeridos, sin tener en cuenta las filas con input deshabilitados

    

    var result = !row.get('date')?.value || !row.get('transactionClassId')?.value || !row.get('detail')?.value || !row.get('assetId')?.value;
    
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


   
    this.cardTransactionsArray.controls.forEach((control) => {
      

      if (control.get('pay')?.value) {
        if (this.selectedPaymentAssets === 'Pesos') {
          totalPesos += parseFloat(control.get('valueInPesos')?.value);
        } else if (this.selectedPaymentAssets === 'Pesos+Dolar') {
          if (Number(control.get('assetId')?.value) === 1) {
            totalPesos += parseFloat(control.get('installmentAmount')?.value);
          }
          else if (Number(control.get('assetId')?.value) === 2){
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

    // Un pago de $0 es valido cuando el saldo a favor de la tarjeta cubrio el resumen entero.
    const minimoPago = this.cardCreditApplied > 0 ? 0 : 0.01;
    if (formValues.pesosPayment === '' || formValues.pesosPayment === null
        || isNaN(formValues.pesosPayment) || formValues.pesosPayment < minimoPago) {
      this.cardPaymentForm.controls['pesosPayment'].setErrors({ 'incorrect': true });
      return;
    }

    if (formValues.cardExpenses === '' || isNaN(formValues.cardExpenses) || formValues.cardExpenses < 0) {
      this.cardPaymentForm.controls['cardExpenses'].setErrors({ 'incorrect': true });
      return;
    }


    if (this.cardCreditApplied > this.cardCreditAvailable) {
      this.toastService.error('El saldo a favor aplicado supera el disponible en la tarjeta.');
      return;
    }

    // check if there are any rows with missing values, except for the disabled inputs
    const incompleteRow = this.cardTransactionsArray.controls.find((control) => this.isRowIncomplete(control as FormGroup));
    if (incompleteRow) {
      this.toastService.error('Hay filas incompletas. Por favor, completa todos los campos antes de continuar.');
      return;
    }
    



    const cardTransactions = this.cardTransactionsArray.controls
      .filter(control => control.get('pay')?.value)
      .map(control => ({
        cardTransactionId: parseInt(control.get('cardTransactionId')?.value) || 0,
        installmentNumber: parseInt(control.get('installmentNumber')?.value) || 0,
        date: control.get('date')?.value,
        transactionClassId: parseInt(control.get('transactionClassId')?.value),
        detail: control.get('detail')?.value,
        assetId: parseInt(control.get('assetId')?.value),
        installment: control.get('installment')?.value,
        installmentAmount: parseFloat(control.get('installmentAmount')?.value) || 0,
        valueInPesos: parseFloat(control.get('valueInPesos')?.value) || 0
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
        cardCreditApplied: this.cardCreditApplied,
        nextClosingDate: this.cardPaymentForm.get('nextClosingDate')?.value || null,
        nextDueDate: this.cardPaymentForm.get('nextDueDate')?.value || null,
        cardTransactions: cardTransactions
      }

      if (cardPaymentRequest.paymentAsset === 'Pesos+Dolar') {
        cardPaymentRequest.paymentAsset = 'P+D';
      } else if (cardPaymentRequest.paymentAsset === 'Pesos') {
        cardPaymentRequest.paymentAsset = 'P';
      }


         this.cardTransactionService.createCardPayment(cardPaymentRequest).subscribe({
           next: () => {
             this.cardPaymentForm.reset();
             this.cardTransactionsArray.clear();
             this.reimbursementsPreview = 0;
             this.cardPendingCredit = null;

             this.toastService.success('Movimiento creado con éxito');
           },
           error: () => {
             this.toastService.error('Error al registrar el pago de tarjeta');
           }
         });

  }
}
