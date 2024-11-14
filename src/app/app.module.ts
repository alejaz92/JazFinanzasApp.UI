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
import { MovementClassListComponent } from './features/movementClass/movement-class-list/movement-class-list.component';
import { MovementClassAddComponent } from './features/movementClass/movement-class-add/movement-class-add.component';
import { MovementClassEditComponent } from './features/movementClass/movement-class-edit/movement-class-edit.component';
import { AssetManagementComponent } from './features/asset/asset-management/asset-management.component';
import { MovementListComponent } from './features/movement/movement-list/movement-list.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { MovementTypePipe } from './shared/pipes/movementType/movement-type.pipe'
import { MovementAddComponent } from './features/movement/movement-add/movement-add.component';
import { MovementEditComponent } from './features/movement/movement-edit/movement-edit.component';
import { CommonModule } from '@angular/common';
import { MovementRefundComponent } from './features/movement/movement-refund/movement-refund.component';
import { SharedModule } from './shared/shared.module';
import { CardMovementsListComponent } from './features/cardMovements/cardMovements-list/card-movements-list/card-movements-list.component';
import { CardMovementsAddComponent } from './features/cardMovements/cardMovements-add/card-movements-add/card-movements-add.component';
import { CardMovementsPayComponent } from './features/cardMovements/cardMovements-pay/card-movements-pay/card-movements-pay.component';
import { CardMovementsEditRecurrentComponent } from './features/cardMovements/card-movements-edit-recurrent/card-movements-edit-recurrent.component';
import { CryptoMovementListComponent } from './features/cryptoMovement/crypto-movement-list/crypto-movement-list.component';
import { CryptoMovementAddComponent } from './features/cryptoMovement/crypto-movement-add/crypto-movement-add.component';





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
    MovementClassListComponent,
    MovementClassAddComponent,
    MovementClassEditComponent,
    AssetManagementComponent,
    MovementListComponent,
    MovementTypePipe,
    MovementAddComponent,
    MovementEditComponent,
    MovementRefundComponent,
    CardMovementsListComponent,
    CardMovementsAddComponent,
    CardMovementsPayComponent,
    CardMovementsEditRecurrentComponent,
    CryptoMovementListComponent,
    CryptoMovementAddComponent
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
