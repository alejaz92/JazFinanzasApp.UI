import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CryptoTransactionListComponent } from './crypto-transaction-list.component';

describe('CryptoTransactionListComponent', () => {
  let component: CryptoTransactionListComponent;
  let fixture: ComponentFixture<CryptoTransactionListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CryptoTransactionListComponent]
    });
    fixture = TestBed.createComponent(CryptoTransactionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
