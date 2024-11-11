import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardMovementsEditRecurrentComponent } from './card-movements-edit-recurrent.component';

describe('CardMovementsEditRecurrentComponent', () => {
  let component: CardMovementsEditRecurrentComponent;
  let fixture: ComponentFixture<CardMovementsEditRecurrentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CardMovementsEditRecurrentComponent]
    });
    fixture = TestBed.createComponent(CardMovementsEditRecurrentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
