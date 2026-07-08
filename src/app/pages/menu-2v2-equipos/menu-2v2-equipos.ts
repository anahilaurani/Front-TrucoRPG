import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConnectionStatusComponent } from '../../components/connection-status/connection-status';
import { SalaService, EstadoEquipos, LobbyListos } from '../../services/sala.service';
import { ToastService } from '../../services/toast/toast.service';
import { PulperiaUiService } from '../../services/pulperiaOverlay/pulperia-overlay-config';
import { Slot } from '../../interfaces/slot';

@Component({
  selector: 'app-menu-2v2-equipos',
  standalone: true,
  imports: [CommonModule, ConnectionStatusComponent],
  templateUrl: './menu-2v2-equipos.html',
  styleUrl: './menu-2v2-equipos.css',
})
export class Menu2v2EquiposComponent implements OnInit, OnDestroy {
  estadoEquipos: EstadoEquipos | null = null;
  lobbyListos: LobbyListos | null = null;
  miEquipo: string | null = null;
  miListo = false;
  errorMsg = '';

  gameMode: '2v2' | '3v3' = '2v2';
  get cupoPorEquipo(): number {
    return this.gameMode === '3v3' ? 3 : 2;
  }

  slotsSanMartin: Slot[] = [];
  slotsBelgrano: Slot[] = [];

  private subs: Subscription[] = [];

  constructor(
    private sala: SalaService,
    private router: Router,
    private route: ActivatedRoute,
    public uiService: PulperiaUiService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    if (this.uiService.esMultijugadorPhaser) {
      this.subs.push(
        this.uiService.estadoOverlay$.subscribe((config) => {
          if (config?.datos?.gameMode) {
            this.gameMode = config.datos.gameMode;
          }
        }),
      );
    } else {
      this.gameMode =
        (this.route.snapshot.queryParamMap.get('gameMode') as any) === '3v3' ? '3v3' : '2v2';
    }

    this.slotsSanMartin = this.slotsVacios();
    this.slotsBelgrano = this.slotsVacios();

    if (!this.sala.codigoSala$.value) {
      if (this.uiService.esMultijugadorPhaser) {
        this.uiService.cambiarSubVista('tipo');
      } else {
        this.router.navigate(['/menu-multijugador-tipo']);
      }
      return;
    }

    this.subs.push(
      this.sala.estadoEquipos$.subscribe((estado) => {
        if (!estado) return;
        this.estadoEquipos = estado;
        this.actualizarSlots(estado);
      }),

      this.sala.lobbyListos$.subscribe((ll) => {
        this.lobbyListos = ll;
      }),

      this.sala.miListo$.subscribe((v) => (this.miListo = v)),

      this.sala.juegoIniciado$.subscribe((v) => {
        if (v) {
          // Si venimos del modo historia, el juego se muestra como overlay
          // (sin cambiar de ruta) para poder volver a la pulpería de historia.
          if (this.uiService.esMultijugadorPhaser && this.router.url.startsWith('/historia')) {
            localStorage.setItem('multiEnHistoria', '1');
            localStorage.removeItem('origenSalaMulti');
            this.uiService.cerrarOverlay();
            const evento =
              this.gameMode === '3v3' ? 'truco-3v3-multi:start' : 'truco-2v2-multi:start';
            window.dispatchEvent(new CustomEvent(evento));
            return;
          }

          let rutaDestino = '/juego/multi';

          if (this.gameMode === '2v2') {
            rutaDestino = '/juego/2v2-multi';
          } else if (this.gameMode === '3v3') {
            rutaDestino = '/juego/3v3';
          }

          // Si el juego se inicia desde la sala Phaser (pulpería), recordamos
          // el origen para volver allí al salir, en lugar de ir al menú.
          if (this.uiService.esMultijugadorPhaser) {
            localStorage.setItem('origenSalaMulti', '1');
          } else {
            localStorage.removeItem('origenSalaMulti');
          }
          localStorage.removeItem('multiEnHistoria');

          this.uiService.cerrarOverlay();

          this.router.navigate([rutaDestino], {
            queryParams: {
              sala: this.sala.codigoSala$.value,
            },
          });
        }
      }),

      this.sala.jugadorDesconectado$.subscribe((v) => {
        if (v) {
          this.errorMsg = 'Un jugador se desconectó de la sala.';
          this.miListo = false;
          this.sala.miListo$.next(false);
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  private actualizarSlots(estado: EstadoEquipos): void {
    const miPosicion = estado.miPosicion;

    // Reconstruir slots por equipo
    const jugadoresSanMartin = estado.jugadores.filter((j) => j.equipo === 'sanMartin');
    const jugadoresBelgrano = estado.jugadores.filter((j) => j.equipo === 'belgrano');

    this.slotsSanMartin = this.construirSlots(jugadoresSanMartin, miPosicion);
    this.slotsBelgrano = this.construirSlots(jugadoresBelgrano, miPosicion);

    // Actualizar mi equipo
    const yo = estado.jugadores.find((j) => j.posicion === miPosicion);
    this.miEquipo = yo?.equipo ?? null;
  }

  private slotsVacios(): Slot[] {
    return Array.from({ length: this.cupoPorEquipo }, () => ({
      posicion: 0,
      ocupado: false,
      esYo: false,
    }));
  }

  private construirSlots(
    jugadores: { posicion: number; equipo: string | null }[],
    miPosicion: number,
  ): Slot[] {
    const slots: Slot[] = this.slotsVacios();
    jugadores.forEach((j, idx) => {
      if (idx < this.cupoPorEquipo) {
        slots[idx] = {
          posicion: j.posicion,
          ocupado: true,
          esYo: j.posicion === miPosicion,
        };
      }
    });
    return slots;
  }

  /** Devuelve true si el botón del equipo debe estar deshabilitado */
  equipoDeshabilitado(equipo: string): boolean {
    if (this.miListo) return true;
    if (this.miEquipo === equipo) return false; // ya estoy en él → siempre habilitado para mostrar estado
    const count =
      equipo === 'sanMartin'
        ? (this.estadoEquipos?.countSanMartin ?? 0)
        : (this.estadoEquipos?.countBelgrano ?? 0);
    return count >= this.cupoPorEquipo;
  }

  async elegirEquipo(equipo: string): Promise<void> {
    if (this.miListo) return;
    if (this.equipoDeshabilitado(equipo) && this.miEquipo !== equipo) {
      this.errorMsg =
        equipo === 'sanMartin'
          ? 'El Equipo San Martín ya está completo.'
          : 'El Equipo Belgrano ya está completo.';
      setTimeout(() => (this.errorMsg = ''), 2500);
      return;
    }
    try {
      await this.sala.elegirEquipo(equipo as 'sanMartin' | 'belgrano');
      this.errorMsg = '';
    } catch {
      this.errorMsg = 'Error al comunicarse con el servidor.';
      this.toast.error(this.errorMsg);
    }
  }

  async comenzar(): Promise<void> {
    if (this.miListo) return;
    if (!this.estadoEquipos?.equiposListos) {
      this.errorMsg = `Los equipos deben estar completos (${this.cupoPorEquipo} vs ${this.cupoPorEquipo}).`;
      return;
    }
    if (!this.miEquipo) {
      this.errorMsg = 'Debés elegir un equipo primero.';
      return;
    }
    try {
      await this.sala.listoParaJugar();
      this.errorMsg = '';
    } catch {
      this.errorMsg = 'Error al comunicarse con el servidor.';
      this.toast.error(this.errorMsg);
    }
  }

  async abandonar(): Promise<void> {
    await this.sala.abandonar();
    if (this.uiService.esMultijugadorPhaser) {
      this.uiService.cambiarSubVista('tipo');
    } else {
      this.router.navigate(['/menu-multijugador-tipo']);
    }
  }
}
