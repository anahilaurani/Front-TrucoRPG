import { TestBed } from '@angular/core/testing';
import { PulperiaUiService } from './pulperia-overlay-config';

describe('PPulperiaUiService', () => {
  let service: PulperiaUiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PulperiaUiService],
    });
    service = TestBed.inject(PulperiaUiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with tipoVista as null', (done) => {
    service.estadoOverlay$.subscribe(estado => {
      expect(estado.tipoVista).toBeNull();
      done();
    });
  });
});
