import { TestBed } from '@angular/core/testing';
import { CasaUiService } from './casa-overlay-config';

describe('CasaOverlayConfig', () => {
  let service: CasaUiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CasaUiService]
    });
    service = TestBed.inject(CasaUiService);
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
