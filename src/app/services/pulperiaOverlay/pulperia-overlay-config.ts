import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface PulperiaOverlayConfig {
  tipoVista: 'tienda' | 'partida-solo' | 'multijugador' | null;
  subVista?: 'menu' | 'tipo' | 'tradicional' | 'sala' | 'equipos' | null;
  datos?: any;
}

@Injectable({
  providedIn: 'root',
})
export class PulperiaUiService {
  private fuenteOverlay = new BehaviorSubject<PulperiaOverlayConfig>({
    tipoVista: null,
    subVista: null,
  });
  estadoOverlay$ = this.fuenteOverlay.asObservable();

  get esFlujoPhaser(): boolean {
    return this.fuenteOverlay.value.tipoVista !== null;
  }

  get esMultijugadorPhaser(): boolean {
    return this.fuenteOverlay.value.tipoVista === 'multijugador';
  }

  abrirOverlay(
    tipoVista: PulperiaOverlayConfig['tipoVista'],
    subVista: PulperiaOverlayConfig['subVista'] = 'tipo',
    datos?: any,
  ) {
    this.fuenteOverlay.next({ tipoVista, subVista, datos });
  }

  cambiarSubVista(subVista: PulperiaOverlayConfig['subVista'], nuevosDatos?: any) {
    const estadoActual = this.fuenteOverlay.value;
    this.fuenteOverlay.next({
      ...estadoActual,
      subVista,
      datos: { ...estadoActual.datos, ...nuevosDatos },
    });
  }

  cerrarOverlay() {
    this.fuenteOverlay.next({ tipoVista: null, subVista: null });
  }
}
