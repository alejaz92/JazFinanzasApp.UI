import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AccountService } from '../../account/services/account.service';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';

export interface BankPromotionFormData {
  amount: number;
  accountId: number;
  date: string;
  notes: string;
}

@Component({
    selector: 'app-bank-promotion-form',
    templateUrl: './bank-promotion-form.component.html',
    styleUrls: ['./bank-promotion-form.component.css'],
    imports: [FormsModule, NgFor]
})
export class BankPromotionFormComponent implements OnInit {
  @Output() formChange = new EventEmitter<BankPromotionFormData | null>();

  amount: number = 0;
  accountId: string = '';
  date: string = '';
  notes: string = '';

  accounts: any[] = [];

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.accountService.getAccountByTypeName('Moneda').subscribe((data: any) => {
      this.accounts = data;
    });
  }

  get isValid(): boolean {
    return this.amount > 0 && !!this.accountId && !!this.date;
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
      notes: this.notes
    });
  }
}
