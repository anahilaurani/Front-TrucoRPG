import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TiendaOverlayComponent } from './tienda-overlay';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('TiendaOverlay', () => {
  let component: TiendaOverlayComponent;
  let fixture: ComponentFixture<TiendaOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiendaOverlayComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(TiendaOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
