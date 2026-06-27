import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { CryptoTransactionService } from './crypto-transaction.service';

describe('CryptoTransactionService', () => {
  let service: CryptoTransactionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(CryptoTransactionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
