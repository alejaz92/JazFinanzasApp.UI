import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { CardListComponent } from './features/card/card-list/card-list.component';
import { CardAddComponent } from './features/card/card-add/card-add.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CardEditComponent } from './features/card/card-edit/card-edit.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    CardListComponent,
    CardAddComponent,
    CardEditComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
