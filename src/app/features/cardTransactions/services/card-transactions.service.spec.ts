import { TestBed } from '@angular/core/testing';

import { CardTransactionsService } from './card-transactions.service';

describe('CardTransactionsService', () => {
  let service: CardTransactionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CardTransactionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
