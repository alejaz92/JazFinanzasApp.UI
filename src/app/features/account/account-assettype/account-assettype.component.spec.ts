import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountAssetTypeComponent } from './account-assetType.component';


describe('AccountAssettypeComponent', () => {
  let component: AccountAssetTypeComponent;
  let fixture: ComponentFixture<AccountAssetTypeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AccountAssetTypeComponent]
    });
    fixture = TestBed.createComponent(AccountAssetTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
