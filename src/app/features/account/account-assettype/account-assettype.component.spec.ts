import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountAssettypeComponent } from './account-assetType.component';

describe('AccountAssettypeComponent', () => {
  let component: AccountAssettypeComponent;
  let fixture: ComponentFixture<AccountAssettypeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AccountAssettypeComponent]
    });
    fixture = TestBed.createComponent(AccountAssettypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
