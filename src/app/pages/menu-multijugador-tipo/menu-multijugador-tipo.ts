import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ConnectionStatusComponent } from '../../components/connection-status/connection-status';
import { PulperiaUiService } from '../../services/pulperiaOverlay/pulperia-overlay-config';

@Component({
  selector: 'app-menu-multijugador-tipo',
  standalone: true,
  imports: [ConnectionStatusComponent],
  templateUrl: './menu-multijugador-tipo.html',
  styleUrl: './menu-multijugador-tipo.css',
})
export class MenuMultijugadorTipo {
  constructor(
    private router: Router,
    protected uiService: PulperiaUiService,
  ) {}

  seleccionarModo(modo: '1v1' | '2v2' | '3v3'): void {
    if (this.uiService.esMultijugadorPhaser) {
      this.uiService.cambiarSubVista('tradicional', { gameMode: modo });
    } else {
      this.router.navigate(['/menu-multijugador-tradicional'], {
        queryParams: { gameMode: modo },
      });
    }
  }

  volver() {
    if (this.uiService.esMultijugadorPhaser) {
      this.uiService.cerrarOverlay();
      window.dispatchEvent(new CustomEvent('resume-game'));
    } else {
      this.router.navigate(['/menu-multijugador']);
    }
  }
}
