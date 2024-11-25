import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardTransactionsAddComponent } from './card-transactions-add.component';

describe('CardTransactionsAddComponent', () => {
  let component: CardTransactionsAddComponent;
  let fixture: ComponentFixture<CardTransactionsAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CardTransactionsAddComponent]
    });
    fixture = TestBed.createComponent(CardTransactionsAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
