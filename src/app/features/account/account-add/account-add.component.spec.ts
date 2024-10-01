import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountAddComponent } from './account-add.component';

describe('AccountAddComponent', () => {
  let component: AccountAddComponent;
  let fixture: ComponentFixture<AccountAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AccountAddComponent]
    });
    fixture = TestBed.createComponent(AccountAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
