import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardTransactionsService } from '../services/card-transactions.service';
import { HttpClient } from '@angular/common/http';
import { Transaction } from 'src/app/features/transaction/models/transaction.model';
import { TransactionClassService } from 'src/app/features/transactionClass/services/transaction-class.service';
import { AssetService } from 'src/app/features/asset/services/asset.service';
import { CardService } from 'src/app/features/card/services/card.service';
import { CardTransactionsAdd } from '../models/cardTransactions-add.model';
import { first } from 'rxjs';

@Component({
  selector: 'app-card-transactions-add',
  templateUrl: './card-transactions-add.component.html',
  styleUrls: ['./card-transactions-add.component.css']
})
export class CardTransactionsAddComponent implements OnInit {
  isLoading: boolean = true;
  cardTransactionForm!: FormGroup;
  selectedMovementType: string = '';
  assets: any[] = [];
  expenseClasses: any[] = [];
  cards: any[] = [];

  successMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private cardTransactionService: CardTransactionsService,
    private transactionClassesService: TransactionClassService,
    private assetService: AssetService,
    private cardService: CardService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.cardTransactionForm = this.fb.group({
      movementType: ['', Validators.required],
      date: ['', Validators.required],
      asset: ['', Validators.required],
      totalAmount: ['', Validators.required],
      detail: ['', Validators.required],
      card: ['', Validators.required],
      expenseClass: ['', Validators.required],
      installments: [1],
      firstInstallmentDate: ['', Validators.required],
      lastInstallmentDate: [''],
    });

    //this.assignFirstInstallment();
    this.loadAssets();
    this.loadExpenseClasses();
    this.loadCards();
  }

  loadAssets() {
    this.assetService.getCardAssets().subscribe((data: any) => {
      this.assets = data;
    });
  }

  loadExpenseClasses() {
    this.transactionClassesService.getAllTransactionClasses().subscribe((data: any) => {
      this.expenseClasses = data.filter((item: any) => item.incExp === 'E');

      this.isLoading = false;
    });
  }

  loadCards() {
    this.cardService.getAllCards().subscribe((data: any) => {
      this.cards = data;
    });
  }

  onMovementTypeChange(event: any) {
    this.selectedMovementType = event.target.value;
    //this.updateInstallments();
  }

  onSubmit() {
    const formValues = this.cardTransactionForm.value;

    if (formValues.movementType === '') {
      this.cardTransactionForm.controls['movementType'].setErrors({ 'incorrect': true });
    }

    if(formValues.date === '') {
      this.cardTransactionForm.controls['date'].setErrors({ 'incorrect': true });
    }

    if (formValues.asset === '') {
      this.cardTransactionForm.controls['asset'].setErrors({ 'incorrect': true });
    }

    if (formValues.card === '') {
      this.cardTransactionForm.controls['card'].setErrors({ 'incorrect': true });
    }

    if (formValues.expenseClass === '') {
      this.cardTransactionForm.controls['expenseClass'].setErrors({ 'incorrect': true });
    }

    if (formValues.detail === '') {
      this.cardTransactionForm.controls['detail'].setErrors({ 'incorrect': true });
    }

    if (formValues.totalAmount === '') {
      this.cardTransactionForm.controls['totalAmount'].setErrors({ 'incorrect': true });
    }

    if(formValues.firstInstallmentDate === '') {
      this.cardTransactionForm.controls['firstInstallmentDate'].setErrors({ 'incorrect': true });
    }

    if (formValues.movementType === 'U') {
      if (formValues.installments === '') {
        this.cardTransactionForm.controls['installments'].setErrors({ 'incorrect': true });
      }
    }

    const [year, month] = formValues.firstInstallmentDate.split('-');

    var cardTransactionAdd: CardTransactionsAdd = {
      date: formValues.date,
      detail: formValues.detail,
      cardId: parseInt(formValues.card),
      transactionClassId: parseInt(formValues.expenseClass),
      assetId: parseInt(formValues.asset),
      totalAmount: parseFloat(formValues.totalAmount) || 0,
      installments: parseInt(formValues.installments) || 1,
      firstInstallment: formValues.firstInstallmentDate + '-01',
      repeat: "NO"
    };

    if (formValues.movementType === 'R') {

      cardTransactionAdd.repeat = "YES";

    }
    else {
      cardTransactionAdd.lastInstallment = formValues.lastInstallmentDate + '-01';
    }


    this.cardTransactionService.addCardTransaction(cardTransactionAdd).subscribe((data: any) => {
      this.cardTransactionForm.reset();
      this.cardTransactionForm.controls['totalAmount'].setValue(0); 
      this.cardTransactionForm.controls['installments'].setValue(1); 
      this.successMessage = 'Gasto Tarjeta agregado correctamente';

      setTimeout(() => {
        this.successMessage = '';
      }, 3000);

    });

    
  }

  updateInstallments() {
    if (this.selectedMovementType === 'U') {
      const [year, month] = this.cardTransactionForm.value.firstInstallmentDate.split('-').map(Number);
    
      // Crear la fecha en el primer día del mes seleccionado
      const firstInstallmentDate = new Date(year, month - 1, 1);

      let lastInstallmentDate = new Date(firstInstallmentDate);

      lastInstallmentDate.setMonth(firstInstallmentDate.getMonth() + this.cardTransactionForm.value.installments - 1);

      this.cardTransactionForm.controls['lastInstallmentDate'].setValue(this.formatDateToMonth(lastInstallmentDate));
    }
  }

  assignFirstInstallment() {

    const date = new Date(this.cardTransactionForm.controls['date'].value);
    const lastThursday = this.getLastThursday(date.getFullYear(), date.getMonth());


    // Comparación de fechas completa en lugar de solo días
    if (date > lastThursday) {
      const nextMonthDate = new Date(date.getFullYear(), date.getMonth() + 1);
      this.cardTransactionForm.controls['firstInstallmentDate'].setValue(this.formatDateToMonth(nextMonthDate));
    } else {
      this.cardTransactionForm.controls['firstInstallmentDate'].setValue(this.formatDateToMonth(date));
    }

    this.updateInstallments();
  }

  // Función para obtener el último jueves del mes
  getLastThursday(year: number, month: number): Date {
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Retrocede hasta encontrar el último jueves
    while (lastDayOfMonth.getDay() !== 4) {
      lastDayOfMonth.setDate(lastDayOfMonth.getDate() - 1);
    }

    return lastDayOfMonth;
  }

  // Formatea la fecha a "YYYY-MM" para el campo de tipo month
  formatDateToMonth(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}`;
  }
}
