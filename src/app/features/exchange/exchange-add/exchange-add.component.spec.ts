import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExchangeAddComponent } from './exchange-add.component';

describe('ExchangeAddComponent', () => {
  let component: ExchangeAddComponent;
  let fixture: ComponentFixture<ExchangeAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExchangeAddComponent]
    });
    fixture = TestBed.createComponent(ExchangeAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
