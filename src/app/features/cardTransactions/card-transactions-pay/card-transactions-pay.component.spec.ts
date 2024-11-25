import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardTransactionsPayComponent } from './card-transactions-pay.component';

describe('CardTransactionsPayComponent', () => {
  let component: CardTransactionsPayComponent;
  let fixture: ComponentFixture<CardTransactionsPayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CardTransactionsPayComponent]
    });
    fixture = TestBed.createComponent(CardTransactionsPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
