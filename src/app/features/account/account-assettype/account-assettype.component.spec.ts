import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AccountAssetTypeComponent } from './account-assetType.component';


describe('AccountAssettypeComponent', () => {
  let component: AccountAssetTypeComponent;
  let fixture: ComponentFixture<AccountAssetTypeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AccountAssetTypeComponent],
      imports: [HttpClientTestingModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(AccountAssetTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
