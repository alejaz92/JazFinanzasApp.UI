import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrencyExchangeAddComponent } from './currency-exchange-add.component';

describe('CurrencyExchangeAddComponent', () => {
  let component: CurrencyExchangeAddComponent;
  let fixture: ComponentFixture<CurrencyExchangeAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CurrencyExchangeAddComponent]
    });
    fixture = TestBed.createComponent(CurrencyExchangeAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
