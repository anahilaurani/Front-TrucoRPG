import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { Historia } from './historia';

describe('Historia', () => {
  let component: Historia;
  let fixture: ComponentFixture<Historia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Historia],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Historia);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
