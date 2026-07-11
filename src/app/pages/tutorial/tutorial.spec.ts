import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from "@angular/router";
import { Tutorial } from './tutorial';

describe('Tutorial', () => {
  let component: Tutorial;
  let fixture: ComponentFixture<Tutorial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tutorial],
      providers: [
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Tutorial);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
