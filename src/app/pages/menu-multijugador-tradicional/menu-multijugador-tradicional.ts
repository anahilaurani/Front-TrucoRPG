import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConnectionStatusComponent } from '../../components/connection-status/connection-status';
import { QrScannerComponent } from '../../components/qr-scanner/qr-scanner';
import { SalaService, SalaPublicaInfo } from '../../services/sala.service';
import { ToastService } from '../../services/toast/toast.service';
import { PulperiaUiService } from '../../services/pulperiaOverlay/pulperia-overlay-config';

@Component({
  selector: 'app-menu-multijugador-tradicional',
  standalone: true,
  imports: [CommonModule, ConnectionStatusComponent, QrScannerComponent, FormsModule],
  templateUrl: './menu-multijugador-tradicional.html',
  styleUrl: './menu-multijugador-tradicional.css',
})
export class MenuMultijugadorTradicional implements OnInit, OnDestroy {
  modalAbierto = false;
  escanerAbierto = false;
  codigoIngresado = '';
  errorUnirse = '';
  cargando = false;
  gameMode: '1v1' | '2v2' | '3v3' = '1v1';

  modalCrearAbierto = false;
  salaPublica = false;

  modalBuscarAbierto = false;
  salasPublicas: SalaPublicaInfo[] = [];
  cargandoBuscar = false;
  errorBuscar = '';

  private subService?: Subscription;

  constructor(
    private sala: SalaService,
    private router: Router,
    private route: ActivatedRoute,
    protected uiService: PulperiaUiService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    if (this.uiService.esMultijugadorPhaser) {
      this.subService = this.uiService.estadoOverlay$.subscribe((config) => {
        if (config?.datos?.gameMode) {
          this.gameMode = config.datos.gameMode;
        }

        if (config?.datos?.codigoSugerido) {
          const codigoMesa = config.datos.codigoSugerido;
          this.unirseConCodigo(codigoMesa);
        }
      });
    } else {
      this.gameMode = (this.route.snapshot.queryParamMap.get('gameMode') as any) ?? '1v1';
    }
  }

  ngOnDestroy(): void {
    if (this.subService) this.subService.unsubscribe();
  }

  abrirModalCrear() {
    this.salaPublica = false;
    this.modalCrearAbierto = true;
  }

  cerrarModalCrear() {
    this.modalCrearAbierto = false;
  }

  confirmarCrear() {
    this.modalCrearAbierto = false;
    if (this.uiService.esMultijugadorPhaser) {
      this.uiService.cambiarSubVista('sala', {
        mode: 'crear',
        gameMode: this.gameMode,
        publica: this.salaPublica,
      });
    } else {
      this.router.navigate(['/menu-multijugador-tradicional-sala'], {
        queryParams: { mode: 'crear', gameMode: this.gameMode, publica: this.salaPublica },
      });
    }
  }

  async abrirModalBuscar() {
    this.modalBuscarAbierto = true;
    await this.refrescarSalas();
  }

  cerrarModalBuscar() {
    if (this.cargando) return;
    this.modalBuscarAbierto = false;
  }

  async refrescarSalas() {
    this.errorBuscar = '';
    this.cargandoBuscar = true;
    try {
      await this.sala.conectar();
      this.salasPublicas = await this.sala.listarSalasPublicas(this.gameMode);
    } catch {
      this.errorBuscar = 'No se pudieron cargar las salas. Verificá la conexión.';
      this.toast.error(this.errorBuscar);
      this.salasPublicas = [];
    } finally {
      this.cargandoBuscar = false;
    }
  }

  async unirseASalaDisponible(codigo: string) {
    await this.unirseConCodigo(codigo, () => this.refrescarSalas());
  }

  abrirModalUnirse() {
    this.codigoIngresado = '';
    this.errorUnirse = '';
    this.modalAbierto = true;
  }

  cerrarModal() {
    if (this.cargando) return;
    this.modalAbierto = false;
  }

  abrirEscanerQr() {
    this.errorUnirse = '';
    this.escanerAbierto = true;
  }

  cerrarEscanerQr() {
    this.escanerAbierto = false;
  }

  onCodigoQr(codigo: string) {
    this.escanerAbierto = false;
    this.codigoIngresado = (codigo ?? '').toUpperCase().trim();
    if (this.codigoIngresado.length >= 6) {
      this.confirmarUnirse();
    }
  }

  async confirmarUnirse() {
    const codigo = this.codigoIngresado.toUpperCase().trim();
    if (codigo.length < 6) {
      this.errorUnirse = 'El código debe tener 6 caracteres.';
      return;
    }
    await this.unirseConCodigo(codigo);
  }

  private async unirseConCodigo(codigo: string, onError?: () => void) {
    this.errorUnirse = '';
    this.cargando = true;
    try {
      this.sala.reset();
      await this.sala.conectar();
      const ok = await this.sala.unirseASala(codigo);

      if (!ok) {
        this.errorUnirse = 'Sala no encontrada o llena.';
        this.cargando = false;
        if (onError) onError();
        return;
      }

      if (this.uiService.esMultijugadorPhaser) {
        this.uiService.cambiarSubVista('sala', {
          mode: 'unirse',
          gameMode: this.gameMode,
          codigoSugerido: null,
        });
      } else {
        this.router.navigate(['/menu-multijugador-tradicional-sala'], {
          queryParams: { mode: 'unirse', gameMode: this.gameMode },
        });
      }
    } catch {
      this.errorUnirse = 'Error de conexión. Verificá que el servidor esté activo.';
      this.toast.error(this.errorUnirse);
      this.cargando = false;
      if (onError) onError();
    }
  }

  cerrar() {
    this.uiService.cerrarOverlay();
    window.dispatchEvent(new CustomEvent('resume-game'));
  }

  volver() {
    if (this.uiService.esMultijugadorPhaser) {
      this.uiService.cambiarSubVista('tipo');
    } else {
      this.router.navigate(['/menu-multijugador-tipo'], {
        queryParams: { gameMode: this.gameMode },
      });
    }
  }
}
