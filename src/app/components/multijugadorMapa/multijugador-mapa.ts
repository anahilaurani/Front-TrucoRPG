import { Component, OnDestroy, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { SalaService } from '../../services/sala.service';
import { PulperiaUiService } from '../../services/pulperiaOverlay/pulperia-overlay-config';
import { PulperiaManager } from '../pulperiaManager/pulperia-manager/pulperia-manager';

@Component({
  selector: 'app-multijugador-mapa',
  standalone: true,
  imports: [CommonModule, PulperiaManager],
  templateUrl: './multijugador-mapa.html',
  styleUrl: './multijugador-mapa.css',
})
export class MultijugadorMapaComponent implements OnDestroy {
  private gameInstance: any = null;

  constructor(
    private router: Router,
    private salaService: SalaService,
    private uiService: PulperiaUiService,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.document.body.classList.add('modo-phaser-mobile');
    this.initGame();
    window.addEventListener('multi-room:exit', this.onExit);
  }

  private async initGame(): Promise<void> {
    const { initMultijugador } = await import('../../../game/multijugadorConfig.js');
    this.gameInstance = initMultijugador(
      'multijugador-container',
      this.salaService,
      this.uiService,
    );
    window.dispatchEvent(new Event('resize'));
  }

  onExit = () => {
    this.router.navigate(['/home']);
  };

  ngOnDestroy(): void {
    window.removeEventListener('multi-room:exit', this.onExit);
    this.document.body.classList.remove('modo-phaser-mobile');
    if (this.gameInstance) {
      this.gameInstance.destroy(true);
      this.gameInstance = null;
    }
  }
}
