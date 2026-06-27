import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { CardTransactionsService } from './card-transactions.service';

describe('CardTransactionsService', () => {
  let service: CardTransactionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(CardTransactionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
