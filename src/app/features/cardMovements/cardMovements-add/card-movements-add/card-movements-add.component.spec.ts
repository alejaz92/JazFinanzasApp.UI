import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardMovementsAddComponent } from './card-movements-add.component';

describe('CardMovementsAddComponent', () => {
  let component: CardMovementsAddComponent;
  let fixture: ComponentFixture<CardMovementsAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CardMovementsAddComponent]
    });
    fixture = TestBed.createComponent(CardMovementsAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
