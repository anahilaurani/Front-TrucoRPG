import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TiendaService } from './tienda-service';

describe('TiendaService', () => {
  let service: TiendaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TiendaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
