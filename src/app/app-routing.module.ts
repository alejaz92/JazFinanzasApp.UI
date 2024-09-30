import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CardListComponent } from './features/card/card-list/card-list.component';
import { CardAddComponent } from './features/card/card-add/card-add.component';
import { CardEditComponent } from './features/card/card-edit/card-edit.component';

const routes: Routes = [
  {
    path: 'management/card',
    component: CardListComponent
  },
  {
    path: 'management/card/add',
    component: CardAddComponent
  },
  {
    path: 'management/card/:id',
    component: CardEditComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
