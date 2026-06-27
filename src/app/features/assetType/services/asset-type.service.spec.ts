import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AssetTypeService } from './asset-type.service';

describe('AssetTypeService', () => {
  let service: AssetTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(AssetTypeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
