import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardMovementsListComponent } from './card-movements-list.component';

describe('CardMovementsListComponent', () => {
  let component: CardMovementsListComponent;
  let fixture: ComponentFixture<CardMovementsListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CardMovementsListComponent]
    });
    fixture = TestBed.createComponent(CardMovementsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
