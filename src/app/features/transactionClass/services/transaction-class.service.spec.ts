import { TestBed } from '@angular/core/testing';

import { TransactionClassService } from './transaction-class.service';

describe('TransactionClassServiceService', () => {
  let service: TransactionClassService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TransactionClassService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
