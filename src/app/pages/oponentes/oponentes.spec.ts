import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Oponentes } from './oponentes';

describe('Oponentes', () => {
  let component: Oponentes;
  let fixture: ComponentFixture<Oponentes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Oponentes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Oponentes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
