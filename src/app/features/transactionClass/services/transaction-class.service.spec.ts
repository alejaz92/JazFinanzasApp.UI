import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TransactionClassService } from './transaction-class.service';

describe('TransactionClassServiceService', () => {
  let service: TransactionClassService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(TransactionClassService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
