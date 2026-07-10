import { Routes } from '@angular/router';
import { AuthGuard } from './features/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home/home.component').then(m => m.HomeComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'management/card',
    loadComponent: () => import('./features/card/card-list/card-list.component').then(m => m.CardListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'management/card/add',
    loadComponent: () => import('./features/card/card-add/card-add.component').then(m => m.CardAddComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'management/card/:id',
    loadComponent: () => import('./features/card/card-edit/card-edit.component').then(m => m.CardEditComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'management/account',
    loadComponent: () => import('./features/account/account-list/account-list.component').then(m => m.AccountListComponent)
  },
  {
    path: 'management/account/add',
    loadComponent: () => import('./features/account/account-add/account-add.component').then(m => m.AccountAddComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'management/account/:id',
    loadComponent: () => import('./features/account/account-edit/account-edit.component').then(m => m.AccountEditComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'management/portfolio',
    loadComponent: () => import('./features/portfolios/portfolio-list/portfolio-list.component').then(m => m.PortfolioListComponent)
  },
  {
    path: 'management/portfolio/add',
    loadComponent: () => import('./features/portfolios/portfolio-add/portfolio-add.component').then(m => m.PortfolioAddComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'management/portfolio/:id',
    loadComponent: () => import('./features/portfolios/portfolio-edit/portfolio-edit.component').then(m => m.PortfolioEditComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'change-password',
    loadComponent: () => import('./features/user/change-password/change-password.component').then(m => m.ChangePasswordComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/user/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'home',
    redirectTo: ''
  },
  {
    path: 'management/account/asset-type/:id',
    loadComponent: () => import('./features/account/account-assettype/account-assetType.component').then(m => m.AccountAssetTypeComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'management/transactionClass',
    loadComponent: () => import('./features/transactionClass/transaction-class-list/transaction-class-list.component').then(m => m.TransactionClassListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'management/transactionClass/add',
    loadComponent: () => import('./features/transactionClass/transaction-class-add/transaction-class-add.component').then(m => m.TransactionClassAddComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'management/transactionClass/:id',
    loadComponent: () => import('./features/transactionClass/transaction-class-edit/transaction-class-edit.component').then(m => m.TransactionClassEditComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'management/assets',
    loadComponent: () => import('./features/asset/asset-management/asset-management.component').then(m => m.AssetManagementComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'transactions',
    loadComponent: () => import('./features/transaction/transaction-list/transaction-list.component').then(m => m.TransactionListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'transactions/add',
    loadComponent: () => import('./features/transaction/transaction-add/transaction-add.component').then(m => m.TransactionAddComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'transactions/:id',
    loadComponent: () => import('./features/transaction/transaction-edit/transaction-edit.component').then(m => m.TransactionEditComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'transactions/refund/:id',
    loadComponent: () => import('./features/transaction/transaction-refund/transaction-refund.component').then(m => m.TransactionRefundComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'cardTransactions',
    loadComponent: () => import('./features/cardTransactions/card-transactions-list/card-transactions-list.component').then(m => m.CardTransactionsListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'cardTransactions/add',
    loadComponent: () => import('./features/cardTransactions/card-transactions-add/card-transactions-add.component').then(m => m.CardTransactionsAddComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'cardTransactions/pay',
    loadComponent: () => import('./features/cardTransactions/card-transactions-pay/card-transactions-pay.component').then(m => m.CardTransactionsPayComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'cardTransactions/editRecurrent/:id',
    loadComponent: () => import('./features/cardTransactions/card-transactions-edit-recurrent/card-transactions-edit-recurrent.component').then(m => m.CardTransactionsEditRecurrentComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'cryptoTransactions',
    loadComponent: () => import('./features/cryptoTransaction/crypto-transaction-list/crypto-transaction-list.component').then(m => m.CryptoTransactionListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'cryptoTransactions/add',
    loadComponent: () => import('./features/cryptoTransaction/crypto-transaction-add/crypto-transaction-add.component').then(m => m.CryptoTransactionAddComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'stockTransactions',
    loadComponent: () => import('./features/stockTransactions/stock-transaction-list/stock-transaction-list.component').then(m => m.StockTransactionListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'stockTransactions/add',
    loadComponent: () => import('./features/stockTransactions/stock-transaction-add/stock-transaction-add.component').then(m => m.StockTransactionAddComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'stockTransactions/splits',
    loadComponent: () => import('./features/stockTransactions/split-event/split-event.component').then(m => m.SplitEventComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'currencyExchange',
    loadComponent: () => import('./features/CurrencyExchange/currency-exchange-list/currency-exchange-list.component').then(m => m.CurrencyExchangeListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'currencyExchange/add',
    loadComponent: () => import('./features/CurrencyExchange/currency-exchange-add/currency-exchange-add.component').then(m => m.CurrencyExchangeAddComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'exchange',
    loadComponent: () => import('./features/exchange/exchange-list/exchange-list.component').then(m => m.ExchangeListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'exchange/add',
    loadComponent: () => import('./features/exchange/exchange-add/exchange-add.component').then(m => m.ExchangeAddComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'portfolioExchange',
    loadComponent: () => import('./features/portfolioExchange/portfolio-exchange-list/portfolio-exchange-list.component').then(m => m.PortfolioExchangeListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'portfolioExchange/add',
    loadComponent: () => import('./features/portfolioExchange/portfolio-exchange-add/portfolio-exchange-add.component').then(m => m.PortfolioExchangeAddComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'balance',
    loadComponent: () => import('./features/report/balance/balance.component').then(m => m.BalanceComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'report',
    loadChildren: () => import('./features/report/report.routes').then(m => m.reportRoutes),
    canActivate: [AuthGuard]
  },
  {
    path: 'resetPassword',
    loadComponent: () => import('./features/user/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'management/people',
    loadComponent: () => import('./features/people/people-list/people-list.component').then(m => m.PeopleListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'management/people/add',
    loadComponent: () => import('./features/people/people-add/people-add.component').then(m => m.PeopleAddComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'management/people/:id',
    loadComponent: () => import('./features/people/people-edit/people-edit.component').then(m => m.PeopleEditComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'shared-expenses',
    loadComponent: () => import('./features/shared-expenses/shared-expense-dashboard/shared-expense-dashboard.component').then(m => m.SharedExpenseDashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: ''
  },
];
