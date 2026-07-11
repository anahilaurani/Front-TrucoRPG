import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { RouterModule, ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { HistoriaService } from '../../services/historia/historia-service';
import { ToastService } from '../../services/toast/toast.service';
import { PERSONAJES } from '../../../game/data/personaje';
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
  private historiaService = inject(HistoriaService);
  private toast           = inject(ToastService);

  headerType      = signal('');
  readonly usuario = this.authService.usuario;
  inicial         = computed(() => this.usuario()?.nombre?.charAt(0).toUpperCase() ?? '?');
  avatarUrl       = computed(() => this.authService.avatarUrl());
  dropdownAbierto = signal(false);

  // ── Cambiar personaje (modo historia) ──────────────────────────────────
  readonly personajes = PERSONAJES;
  cambiarAbierto      = signal(false);
  spriteSeleccionado  = signal<string | null>(null);
  guardandoPersonaje  = signal(false);

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

  abrirCambiarPersonaje(event: Event): void {
    event.stopPropagation();
    this.dropdownAbierto.set(false);
    this.spriteSeleccionado.set(null);
    this.cambiarAbierto.set(true);
    this.cargarPersonajeActual();
  }

  cerrarCambiarPersonaje(): void {
    if (this.guardandoPersonaje()) return;
    this.cambiarAbierto.set(false);
  }

  seleccionarPersonaje(spriteKey: string): void {
    this.spriteSeleccionado.set(spriteKey);
  }

  private cargarPersonajeActual(): void {
    this.historiaService.obtenerPersonajeBD().subscribe({
      next: (personaje) => {
        const actual = (personaje?.spriteKey ?? '').replace('.png', '');
        const base =
          this.personajes.find((p) => actual === p.spriteKey) ??
          this.personajes.find((p) => actual.startsWith(p.spriteKey));
        this.spriteSeleccionado.set(base ? base.spriteKey : null);
      },
      error: () => this.spriteSeleccionado.set(null),
    });
  }

  confirmarCambioPersonaje(): void {
    const spriteKey = this.spriteSeleccionado();
    if (spriteKey === null || this.guardandoPersonaje()) return;

    this.guardandoPersonaje.set(true);
    this.historiaService.equiparAvatarBD(spriteKey).subscribe({
      next: () => {
        this.guardandoPersonaje.set(false);
        this.cambiarAbierto.set(false);
        this.toast.success('¡Personaje actualizado para el modo historia!');
      },
      error: () => {
        this.guardandoPersonaje.set(false);
        this.toast.error('No se pudo cambiar el personaje. Intentá de nuevo.');
      },
    });
  }
}
