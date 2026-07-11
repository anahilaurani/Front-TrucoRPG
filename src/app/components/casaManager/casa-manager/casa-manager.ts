import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CasaUiService } from '../../../services/casaOverlay/casa-overlay-config';
import { InventarioOverlay } from '../../overlays/inventario-overlay/inventario-overlay';
import { LogrosOverlay } from '../../overlays/logros-overlay/logros-overlay';
import { ArmarioOverlay } from '../../overlays/armario-overlay/armario-overlay';

@Component({
  selector: 'app-casa-manager',
  standalone: true,
  imports: [InventarioOverlay, LogrosOverlay, ArmarioOverlay],
  templateUrl: './casa-manager.html',
  styleUrl: './casa-manager.css',
})
export class CasaManager implements OnInit {
  vistaActiva: 'inventario' | 'logros' | 'armario' | null = null;
  datosRecibidos: any = null;

  private vistasValidas = ['inventario', 'logros', 'armario'];

  constructor(
    private uiService: CasaUiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.uiService.estadoOverlay$.subscribe((config) => {
      this.vistaActiva = config.tipoVista;
      this.datosRecibidos = config.datos;
      this.cdr.detectChanges();
    });
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.vistaActiva !== null) {
      this.cerrar();
    }
  }

  @HostListener('window:game-interact', ['$event'])
  onGameInteract(event: Event) {
    const customEvent = event as CustomEvent;
    const vista = customEvent.detail.vista;

    if (!this.vistasValidas.includes(vista)) {
      return;
    }

    this.uiService.abrirOverlay(
      vista as 'inventario' | 'logros' | 'armario',
      customEvent.detail.datos,
    );
  }

  cerrar() {
    this.uiService.cerrarOverlay();
    window.dispatchEvent(new CustomEvent('resume-game'));
  }
}
