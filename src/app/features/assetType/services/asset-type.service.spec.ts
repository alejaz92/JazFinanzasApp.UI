import { TestBed } from '@angular/core/testing';

import { AssetTypeService } from './asset-type.service';

describe('AssetTypeService', () => {
  let service: AssetTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssetTypeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
