import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { RouterModule, ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { Boton } from '../boton/boton';

@Component({
  selector: 'app-header',
  imports: [RouterModule, Boton],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  router          = inject(Router);
  activatedRoute  = inject(ActivatedRoute);
  authService     = inject(AuthService);

  headerType      = signal('');
  readonly usuario = this.authService.usuario;
  inicial         = computed(() => this.usuario()?.nombre?.charAt(0).toUpperCase() ?? '?');
  avatarUrl       = computed(() => this.authService.avatarUrl());
  dropdownAbierto = signal(false);

  constructor() {
    this.actualizarTipo();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.actualizarTipo();
        this.dropdownAbierto.set(false);
      });
  }

  private actualizarTipo(): void {
    let currentRoute = this.router.routerState.root;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }
    const data = currentRoute.snapshot.data;
    this.headerType.set(data['header'] || 'default');
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownAbierto.update(v => !v);
  }

  @HostListener('document:click')
  cerrarDropdown(): void {
    this.dropdownAbierto.set(false);
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.router.navigate(['/']);
  }
}
