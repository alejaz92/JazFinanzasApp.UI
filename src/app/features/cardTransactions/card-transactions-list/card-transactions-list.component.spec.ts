import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardTransactionsListComponent } from './card-transactions-list.component';

describe('CardTransactionsListComponent', () => {
  let component: CardTransactionsListComponent;
  let fixture: ComponentFixture<CardTransactionsListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CardTransactionsListComponent]
    });
    fixture = TestBed.createComponent(CardTransactionsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
