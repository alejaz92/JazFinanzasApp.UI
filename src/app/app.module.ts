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
import { CurrencyFiatFormatPipe } from './pipes/currencyFiatFormat/currency-fiat-format.pipe';
import { MovementTypePipe } from './pipes/movementType/movement-type.pipe';
import { MovementAddComponent } from './features/movement/movement-add/movement-add.component';
import { CurrencyFiatInputFormatPipe } from './pipes/currencyFiatInputFormat/currency-fiat-input-format.pipe';




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
    CurrencyFiatFormatPipe,
    MovementTypePipe,
    MovementAddComponent,
    CurrencyFiatInputFormatPipe    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    NgxPaginationModule
  ],
  providers: [ {
    provide: HTTP_INTERCEPTORS,
    useClass: JwtInterceptor,
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
