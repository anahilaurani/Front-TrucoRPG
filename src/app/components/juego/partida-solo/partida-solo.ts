import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SeleccionPersonaje } from '../../../pages/seleccion-personaje/seleccion-personaje';
import { PulperiaUiService } from '../../../services/pulperiaOverlay/pulperia-overlay-config';

@Component({
  selector: 'app-partida-solo',
  standalone: true,
  imports: [CommonModule, SeleccionPersonaje, RouterLink],
  templateUrl: './partida-solo.html',
  styleUrl: './partida-solo.css',
})
export class PartidaSoloComponent {
  private router = inject(Router);
  private uiService = inject(PulperiaUiService);

  @Input() esOverlay: boolean = false;

  vistaActual: 'menu-principal' | 'seleccion-heroe' | 'seleccion-modo-tradicional' =
    'menu-principal';

  jugarTradicional(modo: '1v1' | '2v2' | '3v3'): void {
    localStorage.removeItem('heroeId');

    if (this.esOverlay) {
      // Desde la pulpería: cerrar el overlay y mostrar el juego como overlay
      // dentro de la historia (sin navegar a otra ruta).
      this.uiService.cerrarOverlay();
      localStorage.setItem('origenPulperia', '1');
      if (modo === '2v2') {
        window.dispatchEvent(new CustomEvent('truco-2v2:start'));
      } else if (modo === '3v3') {
        window.dispatchEvent(new CustomEvent('truco-3v3:start'));
      } else {
        window.dispatchEvent(new CustomEvent('truco-solo:start'));
      }
      return;
    }

    if (modo === '2v2') {
      this.router.navigate(['/jugar/solitario-2v2']);
    } else if (modo === '3v3') {
      this.router.navigate(['/jugar/solitario-3v3']);
    } else {
      this.router.navigate(['/jugar/solitario']);
    }
  }

  alConfirmarHeroe(idHeroe: number): void {
    localStorage.setItem('heroeId', idHeroe.toString());

    if (this.esOverlay) {
      this.uiService.cerrarOverlay();
      localStorage.setItem('origenPulperia', '1');
      window.dispatchEvent(new CustomEvent('truco-solo:start'));
      return;
    }

    this.router.navigate(['/jugar/solitario']);
  }
}
