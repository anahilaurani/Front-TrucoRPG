import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConnectionStatusComponent } from '../../components/connection-status/connection-status';
import { SalaService } from '../../services/sala.service';
import { ToastService } from '../../services/toast/toast.service';
import { PulperiaUiService } from '../../services/pulperiaOverlay/pulperia-overlay-config';

@Component({
  selector: 'app-menu-multijugador-tradicional-sala',
  standalone: true,
  imports: [CommonModule, ConnectionStatusComponent],
  templateUrl: './menu-multijugador-tradicional-sala.html',
  styleUrl: './menu-multijugador-tradicional-sala.css',
})
export class MenuMultijugadorTradicionalSala implements OnInit, OnDestroy {
  mode: 'crear' | 'unirse' = 'crear';
  gameMode: '1v1' | '2v2' | '3v3' = '1v1';
  publica = false;
  codigoSala = '';
  copiado = false;
  qrUrl = '';

  salaLista = false;
  miListo = false;

  jugadoresEnSala = 0;
  get maxJugadores(): number {
    return this.gameMode === '3v3' ? 6 : this.gameMode === '2v2' ? 4 : 2;
  }
  get esPorEquipos(): boolean {
    return this.gameMode === '2v2' || this.gameMode === '3v3';
  }

  errorMsg = '';
  cargandoConexion = true;

  private subs: Subscription[] = [];

  constructor(
    public sala: SalaService,
    private router: Router,
    private route: ActivatedRoute,
    protected uiService: PulperiaUiService,
    private toast: ToastService,
  ) {}

  async ngOnInit() {
    if (this.uiService.esMultijugadorPhaser) {
      this.subs.push(
        this.uiService.estadoOverlay$.subscribe((config) => {
          if (config && config.datos) {
            this.mode = config.datos.mode ?? 'crear';
            this.gameMode = config.datos.gameMode ?? '1v1';
            this.publica = config.datos.publica === true;
          }
        }),
      );
    } else {
      this.mode = (this.route.snapshot.queryParamMap.get('mode') as any) ?? 'crear';
      this.gameMode = (this.route.snapshot.queryParamMap.get('gameMode') as any) ?? '1v1';
      this.publica = this.route.snapshot.queryParamMap.get('publica') === 'true';
    }

    if (this.esPorEquipos && this.mode === 'crear') {
      this.jugadoresEnSala = 1;
    }

    this.subs.push(
      this.sala.codigoSala$.subscribe((c) => {
        this.codigoSala = c;
        if (c) this.actualizarQr(c);
      }),

      this.sala.salaLista$.subscribe((v) => (this.salaLista = v)),
      this.sala.miListo$.subscribe((v) => (this.miListo = v)),

      this.sala.lobbyActualizado$.subscribe((data) => {
        if (data) this.jugadoresEnSala = data.jugadoresEnSala;
      }),

      this.sala.salaCompleta$.subscribe((completa) => {
        if (completa) {
          setTimeout(() => {
            if (this.uiService.esMultijugadorPhaser) {
              this.uiService.cambiarSubVista('equipos', { gameMode: this.gameMode });
            } else {
              this.router.navigate(['/menu-2v2-equipos'], {
                queryParams: { gameMode: this.gameMode },
              });
            }
          }, 600);
        }
      }),

      this.sala.juegoIniciado$.subscribe((v) => {
        if (v) {
          // Si venimos del modo historia, el juego se muestra como overlay
          // (sin cambiar de ruta) para poder volver a la pulpería de historia.
          if (this.uiService.esMultijugadorPhaser && this.router.url.startsWith('/historia')) {
            localStorage.setItem('multiEnHistoria', '1');
            localStorage.removeItem('origenSalaMulti');
            this.uiService.cerrarOverlay();
            window.dispatchEvent(new CustomEvent(this.eventoInicioMulti()));
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
              sala: this.codigoSala || this.sala.codigoSala$.value,
            },
          });
        }
      }),

      this.sala.jugadorDesconectado$.subscribe((v) => {
        if (v) {
          this.errorMsg = 'Un jugador se desconectó.';
          this.salaLista = false;
          this.miListo = false;
          this.jugadoresEnSala = Math.max(0, this.jugadoresEnSala - 1);
        }
      }),
    );

    if (this.mode === 'crear') {
      try {
        await this.sala.conectar();
        await this.sala.crearSala(this.gameMode, this.publica);
      } catch {
        this.errorMsg = 'No se pudo conectar al servidor.';
        this.toast.error(this.errorMsg);
      }
    }

    if (this.esPorEquipos && this.sala.salaCompleta$.value) {
      if (this.uiService.esMultijugadorPhaser) {
        this.uiService.cambiarSubVista('menu', { gameMode: this.gameMode });
      } else {
        this.router.navigate(['/menu-2v2-equipos'], { queryParams: { gameMode: this.gameMode } });
      }
    }

    this.cargandoConexion = false;
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  /** Evento que abre el overlay de juego multi correcto según el modo. */
  private eventoInicioMulti(): string {
    if (this.gameMode === '2v2') return 'truco-2v2-multi:start';
    if (this.gameMode === '3v3') return 'truco-3v3-multi:start';
    return 'truco-multi:start';
  }

  private actualizarQr(codigo: string): void {
    const joinUrl = `${window.location.origin}/unirse?code=${codigo}&mode=${this.gameMode}`;
    const encoded = encodeURIComponent(joinUrl);
    this.qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&color=c89030&bgcolor=0e0c08&data=${encoded}`;
  }

  get slotsLobby(): { lleno: boolean }[] {
    const slots = [];
    for (let i = 0; i < this.maxJugadores; i++) {
      slots.push({ lleno: i < this.jugadoresEnSala });
    }
    return slots;
  }

  async copiarCodigo() {
    if (!this.codigoSala) return;
    await navigator.clipboard.writeText(this.codigoSala).catch(() => {});
    this.copiado = true;
    setTimeout(() => (this.copiado = false), 2000);
  }

  async comenzar() {
    if (this.miListo) return;
    try {
      await this.sala.listoParaJugar();
    } catch {
      this.errorMsg = 'Error al comunicarse con el servidor.';
      this.toast.error(this.errorMsg);
    }
  }

  async abandonar() {
    await this.sala.abandonar();
    if (this.uiService.esMultijugadorPhaser) {
      this.uiService.cambiarSubVista('tradicional');
    } else {
      this.router.navigate(['/menu-multijugador-tradicional'], {
        queryParams: { gameMode: this.gameMode },
      });
    }
  }
}
