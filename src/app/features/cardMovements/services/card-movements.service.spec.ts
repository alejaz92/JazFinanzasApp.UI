import { TestBed } from '@angular/core/testing';

import { CardMovementsService } from './card-movements.service';

describe('CardMovementsService', () => {
  let service: CardMovementsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CardMovementsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
