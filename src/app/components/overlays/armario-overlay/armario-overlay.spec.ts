import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ArmarioOverlay } from './armario-overlay';

describe('ArmarioOverlay', () => {
  let component: ArmarioOverlay;
  let fixture: ComponentFixture<ArmarioOverlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArmarioOverlay],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArmarioOverlay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
