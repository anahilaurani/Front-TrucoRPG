import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { MenuMultijugadorTradicionalSala } from './menu-multijugador-tradicional-sala';

describe('Menu Multijugador Tradicional Sala', () => {
  let component: MenuMultijugadorTradicionalSala;
  let fixture: ComponentFixture<MenuMultijugadorTradicionalSala>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuMultijugadorTradicionalSala],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuMultijugadorTradicionalSala);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
