import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardMovementsPayComponent } from './card-movements-pay.component';

describe('CardMovementsPayComponent', () => {
  let component: CardMovementsPayComponent;
  let fixture: ComponentFixture<CardMovementsPayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CardMovementsPayComponent]
    });
    fixture = TestBed.createComponent(CardMovementsPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
