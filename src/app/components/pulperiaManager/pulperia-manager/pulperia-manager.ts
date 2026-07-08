import { Component, OnInit, HostListener, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PulperiaUiService } from '../../../services/pulperiaOverlay/pulperia-overlay-config';
import { SalaService } from '../../../services/sala.service';
import { TiendaOverlayComponent } from '../../overlays/tienda-overlay/tienda-overlay';
import { PartidaSoloComponent } from '../../juego/partida-solo/partida-solo';
import { MenuMultijugador } from '../../../pages/menu-multijugador/menu-multijugador';
import { MenuMultijugadorTipo } from '../../../pages/menu-multijugador-tipo/menu-multijugador-tipo';
import { MenuMultijugadorTradicional } from '../../../pages/menu-multijugador-tradicional/menu-multijugador-tradicional';
import { MenuMultijugadorTradicionalSala } from '../../../pages/menu-multijugador-tradicional-sala/menu-multijugador-tradicional-sala';
import { Menu2v2EquiposComponent } from '../../../pages/menu-2v2-equipos/menu-2v2-equipos';

@Component({
  selector: 'app-pulperia-manager',
  standalone: true,
  imports: [
    CommonModule,
    TiendaOverlayComponent,
    PartidaSoloComponent,
    MenuMultijugador,
    MenuMultijugadorTipo,
    MenuMultijugadorTradicional,
    MenuMultijugadorTradicionalSala,
    Menu2v2EquiposComponent
  ],
  templateUrl: './pulperia-manager.html',
  styleUrls: ['./pulperia-manager.css'],
})
export class PulperiaManager implements OnInit {
  vistaActiva: 'tienda' | 'partida-solo' | 'multijugador' | null = null;
  subVistaActiva: 'menu' | 'tipo' | 'tradicional' | 'sala' | 'equipos' = 'menu';
  datosRecibidos: any = null;

  private vistasValidas = ['tienda', 'partida-solo', 'multijugador'];

  constructor(
    private uiService: PulperiaUiService,
    private salaService: SalaService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
  ) {}

  ngOnInit(): void {
    this.uiService.estadoOverlay$.subscribe((config) => {
      this.vistaActiva = config.tipoVista;
      this.subVistaActiva = config.subVista || 'menu';
      this.datosRecibidos = config.datos;
      this.cdr.detectChanges();
    });
  }

  @HostListener('window:game-interact', ['$event'])
  onGameInteract(event: Event) {
    const customEvent = event as CustomEvent;
    const vista = customEvent.detail.vista;

    if (!this.vistasValidas.includes(vista)) {
      return;
    }

    this.zone.run(() => {
      const subVista = customEvent.detail.datos?.subVista || 'menu';
      this.uiService.abrirOverlay(
        vista as 'tienda' | 'partida-solo' | 'multijugador',
        subVista,
        customEvent.detail.datos,
      );
      this.cdr.detectChanges();
    });
  }

  async cerrar() {
    if (this.subVistaActiva === 'sala' && this.salaService.codigoSala$.value) {
      await this.salaService.abandonar();
    }
    this.uiService.cerrarOverlay();
    window.dispatchEvent(new CustomEvent('resume-game'));
  }
}
