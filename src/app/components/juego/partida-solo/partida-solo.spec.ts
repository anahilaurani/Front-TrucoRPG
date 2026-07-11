import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PartidaSoloComponent } from './partida-solo';
import { provideRouter } from "@angular/router";
describe('PartidaSolo', () => {
  let component: PartidaSoloComponent;
  let fixture: ComponentFixture<PartidaSoloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartidaSoloComponent],
      providers: [
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartidaSoloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
