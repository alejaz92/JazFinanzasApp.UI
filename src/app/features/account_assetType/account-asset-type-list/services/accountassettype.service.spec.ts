import { TestBed } from '@angular/core/testing';

import { AccountassettypeService } from './accountassettype.service';

describe('AccountassettypeService', () => {
  let service: AccountassettypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccountassettypeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
