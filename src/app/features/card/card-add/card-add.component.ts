import { Component } from '@angular/core';
import { CardAddRequest } from '../models/card-add-request.model';

@Component({
  selector: 'app-card-add',
  templateUrl: './card-add.component.html',
  styleUrls: ['./card-add.component.css']
})
export class CardAddComponent {
model: CardAddRequest;

  constructor() {
    this.model = {
      name: ''
    };
  }

  onFormSubmit() {
    console.log(this.model);
  }
}
