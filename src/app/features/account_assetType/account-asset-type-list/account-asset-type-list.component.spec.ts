import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountAssetTypeListComponent } from './account-asset-type-list.component';

describe('AccountAssetTypeListComponent', () => {
  let component: AccountAssetTypeListComponent;
  let fixture: ComponentFixture<AccountAssetTypeListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AccountAssetTypeListComponent]
    });
    fixture = TestBed.createComponent(AccountAssetTypeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
