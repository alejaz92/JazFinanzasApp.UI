import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovementClassListComponent } from './movement-class-list.component';

describe('MovementClassListComponent', () => {
  let component: MovementClassListComponent;
  let fixture: ComponentFixture<MovementClassListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MovementClassListComponent]
    });
    fixture = TestBed.createComponent(MovementClassListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
