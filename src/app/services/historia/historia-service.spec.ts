import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { HistoriaService } from './historia-service';

describe('HistoriaService', () => {
  let service: HistoriaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HistoriaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
