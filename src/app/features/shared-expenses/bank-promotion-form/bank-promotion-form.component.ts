import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AccountService } from '../../account/services/account.service';
import { TransactionClassService } from '../../transactionClass/services/transaction-class.service';

export interface BankPromotionFormData {
  amount: number;
  accountId: number;
  date: string;
  transactionClassId: number;
  notes: string;
}

@Component({
  selector: 'app-bank-promotion-form',
  templateUrl: './bank-promotion-form.component.html',
  styleUrls: ['./bank-promotion-form.component.css']
})
export class BankPromotionFormComponent implements OnInit {
  @Output() formChange = new EventEmitter<BankPromotionFormData | null>();

  amount: number = 0;
  accountId: string = '';
  date: string = '';
  transactionClassId: string = '';
  notes: string = '';

  accounts: any[] = [];
  incomeClasses: any[] = [];

  constructor(
    private accountService: AccountService,
    private transactionClassService: TransactionClassService
  ) {}

  ngOnInit(): void {
    this.accountService.getAccountByTypeName('Moneda').subscribe((data: any) => {
      this.accounts = data;
    });
    this.transactionClassService.getAllTransactionClasses().subscribe((data: any) => {
      this.incomeClasses = data.filter((c: any) => c.incExp === 'I');
    });
  }

  get isValid(): boolean {
    return this.amount > 0 && !!this.accountId && !!this.date && !!this.transactionClassId;
  }

  onChange(): void {
    if (!this.isValid) {
      this.formChange.emit(null);
      return;
    }

    this.formChange.emit({
      amount: Number(this.amount),
      accountId: Number(this.accountId),
      date: this.date,
      transactionClassId: Number(this.transactionClassId),
      notes: this.notes
    });
  }
}
