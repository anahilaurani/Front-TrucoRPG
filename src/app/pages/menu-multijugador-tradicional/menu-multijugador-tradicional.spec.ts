import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient  } from "@angular/common/http";
import { MenuMultijugadorTradicional } from './menu-multijugador-tradicional';

describe('Menu Multijugador Tradicional', () => {
  let component: MenuMultijugadorTradicional;
  let fixture: ComponentFixture<MenuMultijugadorTradicional>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuMultijugadorTradicional],
      providers: [provideRouter([]),provideHttpClient(), provideHttpClientTesting()]  
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuMultijugadorTradicional);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
