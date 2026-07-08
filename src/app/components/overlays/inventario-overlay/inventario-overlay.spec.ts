import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { InventarioOverlay } from './inventario-overlay';

describe('InventarioOverlay', () => {
  let component: InventarioOverlay;
  let fixture: ComponentFixture<InventarioOverlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventarioOverlay],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventarioOverlay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
