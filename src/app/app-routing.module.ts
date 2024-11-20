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
import { MovementClassListComponent } from './features/movementClass/movement-class-list/movement-class-list.component';
import { MovementClassAddComponent } from './features/movementClass/movement-class-add/movement-class-add.component';
import { MovementClassEditComponent } from './features/movementClass/movement-class-edit/movement-class-edit.component';
import { AccountAssetTypeComponent } from './features/account/account-assettype/account-assetType.component';
import { AssetManagementComponent } from './features/asset/asset-management/asset-management.component';
import { MovementListComponent } from './features/movement/movement-list/movement-list.component';
import { MovementAddComponent } from './features/movement/movement-add/movement-add.component';
import { MovementEditComponent } from './features/movement/movement-edit/movement-edit.component';
import { MovementRefundComponent } from './features/movement/movement-refund/movement-refund.component';
import { CardMovementsListComponent } from './features/cardMovements/cardMovements-list/card-movements-list/card-movements-list.component';
import { CardMovementsAddComponent } from './features/cardMovements/cardMovements-add/card-movements-add/card-movements-add.component';
import { CardMovementsPayComponent } from './features/cardMovements/cardMovements-pay/card-movements-pay/card-movements-pay.component';
import { CardMovementsEditRecurrentComponent } from './features/cardMovements/card-movements-edit-recurrent/card-movements-edit-recurrent.component';
import { CryptoMovementListComponent } from './features/cryptoMovement/crypto-movement-list/crypto-movement-list.component';
import { CryptoMovementAddComponent } from './features/cryptoMovement/crypto-movement-add/crypto-movement-add.component';
import { StockTransactionListComponent } from './features/stockTransactions/stock-transaction-list/stock-transaction-list.component';
import { StockTransactionAddComponent } from './features/stockTransactions/stock-transaction-add/stock-transaction-add.component';


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
    path: 'management/movementClass',
    component: MovementClassListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'management/movementClass/add',
    component: MovementClassAddComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'management/movementClass/:id',
    component: MovementClassEditComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'management/assets',
    component: AssetManagementComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'movements',
    component: MovementListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'movements/add',
    component: MovementAddComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'movements/:id',
    component: MovementEditComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'movements/refund/:id',
    component: MovementRefundComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'cardMovements',
    component: CardMovementsListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'cardMovements/add',
    component: CardMovementsAddComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'cardMovements/pay',
    component: CardMovementsPayComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'cardMovements/editRecurrent/:id',
    component: CardMovementsEditRecurrentComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'cryptoMovements',
    component: CryptoMovementListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'cryptoMovements/add',
    component: CryptoMovementAddComponent,
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
    path: '**',
    redirectTo: ''
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
