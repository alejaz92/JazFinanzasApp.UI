import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardTransactionsEditRecurrentComponent } from './card-transactions-edit-recurrent.component';

describe('CardTransactionsEditRecurrentComponent', () => {
  let component: CardTransactionsEditRecurrentComponent;
  let fixture: ComponentFixture<CardTransactionsEditRecurrentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CardTransactionsEditRecurrentComponent]
    });
    fixture = TestBed.createComponent(CardTransactionsEditRecurrentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
