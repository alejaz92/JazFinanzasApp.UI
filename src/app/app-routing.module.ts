import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CardListComponent } from './features/card/card-list/card-list.component';
import { CardAddComponent } from './features/card/card-add/card-add.component';
import { CardEditComponent } from './features/card/card-edit/card-edit.component';
import { LoginComponent } from './features/auth/login/login.component';
import { AuthGuard } from './features/auth/guards/auth.guard';
import { HomeComponent } from './features/home/home/home.component';
import { AccountListComponent } from './features/account/account-list/account-list.component';
import { AccountAddComponent } from './features/account/account-add/account-add.component';
import { AccountEditComponent } from './features/account/account-edit/account-edit.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ProfileComponent } from './features/user/profile/profile.component';
import { ChangePasswordComponent } from './features/user/change-password/change-password.component';
import { TransactionClassListComponent } from './features/transactionClass/transaction-class-list/transaction-class-list.component';
import { TransactionClassAddComponent } from './features/transactionClass/transaction-class-add/transaction-class-add.component';
import { TransactionClassEditComponent } from './features/transactionClass/transaction-class-edit/transaction-class-edit.component';
import { AccountAssetTypeComponent } from './features/account/account-assettype/account-assetType.component';
import { AssetManagementComponent } from './features/asset/asset-management/asset-management.component';
import { TransactionListComponent } from './features/transaction/transaction-list/transaction-list.component';
import { TransactionAddComponent } from './features/transaction/transaction-add/transaction-add.component';
import { TransactionEditComponent } from './features/transaction/transaction-edit/transaction-edit.component';
import { TransactionRefundComponent } from './features/transaction/transaction-refund/transaction-refund.component';
import { CardTransactionsListComponent } from './features/cardTransactions/card-transactions-list/card-transactions-list.component';
import { CardTransactionsAddComponent } from './features/cardTransactions/card-transactions-add/card-transactions-add.component';
import { CardTransactionsPayComponent } from './features/cardTransactions/card-transactions-pay/card-transactions-pay.component';
import { CardTransactionsEditRecurrentComponent } from './features/cardTransactions/card-transactions-edit-recurrent/card-transactions-edit-recurrent.component';
import { CryptoTransactionListComponent } from './features/cryptoTransaction/crypto-transaction-list/crypto-transaction-list.component';
import { CryptoTransactionAddComponent } from './features/cryptoTransaction/crypto-transaction-add/crypto-transaction-add.component';
import { StockTransactionListComponent } from './features/stockTransactions/stock-transaction-list/stock-transaction-list.component';
import { StockTransactionAddComponent } from './features/stockTransactions/stock-transaction-add/stock-transaction-add.component';
import { CurrencyExchangeListComponent } from './features/CurrencyExchange/currency-exchange-list/currency-exchange-list.component';
import { CurrencyExchangeAddComponent } from './features/CurrencyExchange/currency-exchange-add/currency-exchange-add.component';
import { ExchangeListComponent } from './features/exchange/exchange-list/exchange-list.component';
import { ExchangeAddComponent } from './features/exchange/exchange-add/exchange-add.component';
import { BalanceComponent } from './features/report/balance/balance.component';
import { ReportsComponent } from './features/report/reports/reports.component';


const routes: Routes = [
  {
    path: '',
    component : HomeComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'management/card',
    component: CardListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'management/card/add',
    component: CardAddComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'management/card/:id',
    component: CardEditComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'management/account',
    component: AccountListComponent
  },
  {
    path: 'management/account/add',
    component: AccountAddComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'management/account/:id',
    component: AccountEditComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'change-password',
    component: ChangePasswordComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'home',
    redirectTo: ''
  },
  {
    path: 'management/account/asset-type/:id',
    component: AccountAssetTypeComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'management/transactionClass',
    component: TransactionClassListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'management/transactionClass/add',
    component: TransactionClassAddComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'management/transactionClass/:id',
    component: TransactionClassEditComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'management/assets',
    component: AssetManagementComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'transactions',
    component: TransactionListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'transactions/add',
    component: TransactionAddComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'transactions/:id',
    component: TransactionEditComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'transactions/refund/:id',
    component: TransactionRefundComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'cardTransactions',
    component: CardTransactionsListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'cardTransactions/add',
    component: CardTransactionsAddComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'cardTransactions/pay',
    component: CardTransactionsPayComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'cardTransactions/editRecurrent/:id',
    component: CardTransactionsEditRecurrentComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'cryptoTransactions',
    component: CryptoTransactionListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'cryptoTransactions/add',
    component: CryptoTransactionAddComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'stockTransactions',
    component: StockTransactionListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'stockTransactions/add',
    component: StockTransactionAddComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'currencyExchange',
    component: CurrencyExchangeListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'currencyExchange/add',
    component: CurrencyExchangeAddComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'exchange',
    component: ExchangeListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'exchange/add',
    component: ExchangeAddComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'balance',
    component: BalanceComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'report',
    component: ReportsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: ''
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
