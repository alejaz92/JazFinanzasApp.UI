import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccountService } from 'src/app/features/account/services/account.service';
import { CardService } from 'src/app/features/card/services/card.service';
import { CardMovementPaymentList } from '../../models/CardMovementePayment-List.model';
import { CardMovementsService } from '../../services/card-movements.service';

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
    private CardService: CardService,
    private accountService: AccountService,
    private cardMovementService: CardMovementsService
    

  ) {  }

  ngOnInit(): void {  

    this.cardPaymentForm = this.fb.group({
      card: [''],
      paymentMonth: ['', Validators.required],
      date: [new Date(), Validators.required],
      account: [''],
      paymentAssets: ['', Validators.required],
      valueInPesos: ['', Validators.required],
      cardExpenses: [''],
      cardMovements: this.fb.array([]),
    })

    this.loadCards();
    this.loadAccounts();
  }

  loadCards() {
    this.CardService.getAllCards().subscribe((data: any) => {
      this.cards = data;
    });
  }

  loadAccounts() {
    this.accountService.getAccountByTypeName("Moneda").subscribe((data: any) => {
      this.accounts = data;
    });
  }

  loadMovements() {
    var card = this.cardPaymentForm.get('card')?.value;
    var paymentMonth = this.cardPaymentForm.get('paymentMonth')?.value;

    console.log(card);
   
    console.log(paymentMonth);
    // darle formato yyyy-MM-dd a paymentMonth
    //paymentMonth = paymentMonth.getFullYear() + '-' + paymentMonth.getMonth() + '-01';
    

    if (card && paymentMonth) {
      this.cardMovementService.getPaymentCardMovements(card, paymentMonth).subscribe((data: any) => {
        console.log(data);
        this.cardMovements = data;
      });
    }
  }

  onSubmit() {
    console.log('submit');
  }

}
