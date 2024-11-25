import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { CardListComponent } from './features/card/card-list/card-list.component';
import { CardAddComponent } from './features/card/card-add/card-add.component';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { CardEditComponent } from './features/card/card-edit/card-edit.component';
import { LoginComponent } from './features/auth/login/login.component';
import { JwtInterceptor } from './core/interceptors/jwt';
import { HomeComponent } from './features/home/home/home.component';
import { AccountListComponent } from './features/account/account-list/account-list.component';
import { AccountAddComponent } from './features/account/account-add/account-add.component';
import { AccountEditComponent } from './features/account/account-edit/account-edit.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ProfileComponent } from './features/user/profile/profile.component';
import { ChangePasswordComponent } from './features/user/change-password/change-password.component';
import { AccountAssetTypeComponent } from './features/account/account-assettype/account-assetType.component';
import { TransactionClassListComponent } from './features/transactionClass/transaction-class-list/transaction-class-list.component';
import { TransactionClassAddComponent } from './features/transactionClass/transaction-class-add/transaction-class-add.component';
import { TransactionClassEditComponent } from './features/transactionClass/transaction-class-edit/transaction-class-edit.component';
import { AssetManagementComponent } from './features/asset/asset-management/asset-management.component';
import { TransactionListComponent } from './features/transaction/transaction-list/transaction-list.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { MovementTypePipe } from './shared/pipes/movementType/movement-type.pipe'
import { TransactionAddComponent } from './features/transaction/transaction-add/transaction-add.component';
import { TransactionEditComponent } from './features/transaction/transaction-edit/transaction-edit.component';
import { CommonModule } from '@angular/common';
import { TransactionRefundComponent } from './features/transaction/transaction-refund/transaction-refund.component';
import { SharedModule } from './shared/shared.module';
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





@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    CardListComponent,
    CardAddComponent,
    CardEditComponent,
    LoginComponent,
    HomeComponent,
    AccountListComponent,
    AccountAddComponent,
    AccountEditComponent,
    RegisterComponent,
    ProfileComponent,
    ChangePasswordComponent,
    AccountAssetTypeComponent,
    TransactionClassListComponent,
    TransactionClassAddComponent,
    TransactionClassEditComponent,
    AssetManagementComponent,
    TransactionListComponent,
    MovementTypePipe,
    TransactionAddComponent,
    TransactionEditComponent,
    TransactionRefundComponent,
    CardTransactionsListComponent,
    CardTransactionsAddComponent,
    CardTransactionsPayComponent,
    CardTransactionsEditRecurrentComponent,
    CryptoTransactionListComponent,
    CryptoTransactionAddComponent,
    StockTransactionListComponent,
    StockTransactionAddComponent,
    CurrencyExchangeListComponent,
    CurrencyExchangeAddComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    CommonModule,
    SharedModule
    
  ],
  providers: [ {
    provide: HTTP_INTERCEPTORS,
    useClass: JwtInterceptor,
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
