import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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

  constructor(
    private fb: FormBuilder,
    private cardService: CardService,
    private accountService: AccountService,
    private cardMovementService: CardMovementsService,
  ) {}

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
      pesosPayment: [''],
      cardExpenses: [{ value: '', disabled: true }],
      cardMovementsArray: this.fb.array([]) // Definición del FormArray correcta
    });



    this.loadCards();
    this.loadAccounts();
    

    this.cardPaymentForm.get('card')?.valueChanges.subscribe(() => this.loadTable());

     this.cardPaymentForm.get('paymentMonth')?.valueChanges.subscribe(() => this.loadTable());

     this.cardPaymentForm.get('paymentAssets')?.valueChanges.subscribe(() => this.updateEditOptions());
  }

  get cardMovementsArray(): FormArray {
    return this.cardPaymentForm.get('cardMovementsArray') as FormArray;
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
        
      });
    }
  }

  populateCardMovementsArray(cardMovements: any[]) {
    const cardMovementsArray = this.cardMovementsArray;

    
    cardMovementsArray.clear();

    
    cardMovements.forEach(movement => {
      const movementGroup = this.fb.group({
        date: [movement.date],
        movementClass: [movement.movementClass],
        detail: [movement.detail],
        installment: [movement.installment],
        asset: [movement.asset],
        installmentAmount: [movement.installmentAmount],
        valueInPesos: [movement.valueInPesos],
        Pay: [true] // Valor inicial de la checkbox
      });
      

      cardMovementsArray.push(movementGroup);
    });
  }


  updateEditOptions() {
    const paymentAssets = this.cardPaymentForm.get('paymentAssets')?.value;

    this.cardMovementsArray.controls.forEach((control) => {
      if (paymentAssets === 'Pesos') {
        control.get('valueInPesos')?.enable();
        control.get('installmentAmount')?.disable();
      } else if (paymentAssets === 'Pesos+Dolar') {
        control.get('valueInPesos')?.disable();
        control.get('installmentAmount')?.enable();
      } else {
        control.get('valueInPesos')?.disable();
        control.get('installmentAmount')?.disable();
      }
    });
  }

  onSubmit() {
    // Implementar lógica de envío
  }
}
