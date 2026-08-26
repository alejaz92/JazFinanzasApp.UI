import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AccountService } from '../../account/services/account.service';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { CreditTarget } from '../../card-transaction-discount/models/card-transaction-discount.model';

export interface BankPromotionFormData {
  amount: number;
  creditTarget: CreditTarget;
  accountId: number | null;
  date: string;
  notes: string;
}

@Component({
    selector: 'app-bank-promotion-form',
    templateUrl: './bank-promotion-form.component.html',
    styleUrls: ['./bank-promotion-form.component.css'],
    imports: [FormsModule, NgFor, NgIf]
})
export class BankPromotionFormComponent implements OnInit {
  @Output() formChange = new EventEmitter<BankPromotionFormData | null>();

  amount: number = 0;
  creditTarget: CreditTarget = 'ACCOUNT';
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

  get acreditaEnCuenta(): boolean {
    return this.creditTarget === 'ACCOUNT';
  }

  // La cuenta solo se pide cuando el banco acreditó ahí. Sobre la tarjeta no entra plata a
  // ninguna cuenta, así que exigirla no tendría sentido.
  get isValid(): boolean {
    return this.amount > 0 && !!this.date && (!this.acreditaEnCuenta || !!this.accountId);
  }

  onCreditTargetChange(): void {
    if (!this.acreditaEnCuenta) {
      this.accountId = '';
    }
    this.onChange();
  }

  onChange(): void {
    if (!this.isValid) {
      this.formChange.emit(null);
      return;
    }

    this.formChange.emit({
      amount: Number(this.amount),
      creditTarget: this.creditTarget,
      accountId: this.acreditaEnCuenta ? Number(this.accountId) : null,
      date: this.date,
      notes: this.notes
    });
  }
}
