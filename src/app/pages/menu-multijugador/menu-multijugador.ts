import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConnectionStatusComponent } from '../../components/connection-status/connection-status';
import { PulperiaUiService } from '../../services/pulperiaOverlay/pulperia-overlay-config';

@Component({
  selector: 'app-menu-multijugador',
  standalone: true,
  imports: [ConnectionStatusComponent],
  templateUrl: './menu-multijugador.html',
  styleUrl: './menu-multijugador.css',
})
export class MenuMultijugador implements OnInit {
  constructor(
    private router: Router,
    public uiService: PulperiaUiService,
  ) {}

  ngOnInit() {
    if (this.uiService.esMultijugadorPhaser) {
      this.irATradicional();
    }
  }

  irATradicional() {
    if (this.uiService.esMultijugadorPhaser) {
      this.uiService.cambiarSubVista('tipo');
    } else {
      this.router.navigate(['/menu-multijugador-tipo']);
    }
  }

  volver() {
    if (this.uiService.esMultijugadorPhaser) {
      this.uiService.cerrarOverlay();
      window.dispatchEvent(new CustomEvent('resume-game'));
    } else {
      this.router.navigate(['/home']);
    }
  }
}