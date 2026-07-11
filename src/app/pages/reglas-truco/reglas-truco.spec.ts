import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from "@angular/router";
import { ReglasTruco } from './reglas-truco';

describe('ReglasTruco', () => {
  let component: ReglasTruco;
  let fixture: ComponentFixture<ReglasTruco>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReglasTruco],
      providers: [
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReglasTruco);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
