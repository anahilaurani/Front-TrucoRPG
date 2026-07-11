import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { PulperiaManager } from './pulperia-manager';

describe('PulperiaManager', () => {
  let component: PulperiaManager;
  let fixture: ComponentFixture<PulperiaManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PulperiaManager],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PulperiaManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
