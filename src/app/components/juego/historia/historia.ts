import { Component, OnDestroy, Inject, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { SeleccionPersonajeHistoria } from '../../../pages/seleccion-personaje-historia/seleccion-personaje-historia';
import { HistoriaService } from '../../../services/historia/historia-service';
import { TrucoSoloComponent } from '../../../../game/truco-solo/truco-solo.component';
import { TrucoSolo2v2Component } from '../../../../game/truco-solo-2v2/truco-solo-2v2.component';
import { TrucoSolo3v3Component } from '../../../../game/truco-solo-3v3/truco-solo-3v3.component';
import { TrucoMultiComponent } from '../../../../game/truco-multi/truco-multi.component';
import { TrucoMulti2v2Component } from '../../../../game/truco-2v2/truco-2v2.component';
import { Truco3v3Component } from '../../../../game/truco-3v3/truco-3v3.component';
import { CasaManager } from '../../casaManager/casa-manager/casa-manager';
import { PulperiaManager } from '../../pulperiaManager/pulperia-manager/pulperia-manager';
import { Prologo } from '../../../pages/prologo/prologo';
import { SalaService } from '../../../services/sala.service';
import { PulperiaUiService } from '../../../services/pulperiaOverlay/pulperia-overlay-config';
import { personajePorId } from '../../../../game/data/personaje';

@Component({
  selector: 'app-historia',
  standalone: true,
  imports: [
    CommonModule,
    SeleccionPersonajeHistoria,
    TrucoSoloComponent,
    TrucoSolo2v2Component,
    TrucoSolo3v3Component,
    TrucoMultiComponent,
    TrucoMulti2v2Component,
    Truco3v3Component,
    CasaManager,
    PulperiaManager,
    Prologo,
  ],
  templateUrl: './historia.html',
  styleUrl: './historia.css',
})
export class Historia implements OnInit, OnDestroy {
  cargandoEstado = true;
  vistaActual: 'seleccion-heroe' | 'prologo' | 'en-juego' = 'seleccion-heroe';

  mostrarTrucoSolo = false;
  mostrarTruco2v2 = false;
  mostrarTruco3v3 = false;
  mostrarTrucoMulti = false;
  mostrarTruco2v2Multi = false;
  mostrarTruco3v3Multi = false;

  constructor(
    private historiaService: HistoriaService,
    private salaService: SalaService,
    private uiService: PulperiaUiService,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit(): void {
    this.historiaService.verificarPersonajeBD().subscribe({
      next: (res) => {
        if (res.tienePersonaje) {
          const vistaGuardada = localStorage.getItem('historia_vista_actual');
          this.vistaActual = (vistaGuardada as any) || 'en-juego';

          if (this.vistaActual === 'en-juego') {
            this.alTerminarPrologo();
          }
        } else {
          this.vistaActual = 'seleccion-heroe';
        }
        this.cargandoEstado = false;
      },
      error: (err) => {
        console.error('Error al verificar personaje', err);
        this.cargandoEstado = false;
      },
    });

    this.inicializarListeners();
  }

  alConfirmarHeroe(evento: { heroeId: number; habilidad: string }): void {
    this.historiaService.setHeroeSeleccionado(evento.heroeId);
    this.historiaService.setHabilidadSeleccionada(evento.habilidad);

    const heroeData = personajePorId(evento.heroeId);
    const spriteKey = heroeData ? heroeData.spriteKey : 'personaje1';

    this.historiaService.guardarPersonajeBD(evento.habilidad, spriteKey).subscribe({
      next: () => {
        this.vistaActual = 'prologo';
        localStorage.setItem('historia_vista_actual', 'prologo');
        this.document.body.classList.add('modo-phaser-mobile');
      },
      error: (err) => {
        alert('Error al guardar personaje: ' + (err.error || err.message));
      },
    });
  }

  alTerminarPrologo(): void {
    this.vistaActual = 'en-juego';
    localStorage.setItem('historia_vista_actual', 'en-juego');
    this.document.body.classList.add('modo-phaser-mobile');
    setTimeout(() => {
      this.historiaService.iniciarJuego('historia-container', this.salaService, this.uiService);
      window.dispatchEvent(new Event('resize'));
    }, 50);
  }

  // ── Handlers de Mesas de Truco ──
  abrirMesaTruco = (): void => {
    this.mostrarTrucoSolo = true;
    this.prepararCombate();
  };
  cerrarMesaTruco = (): void => {
    this.mostrarTrucoSolo = false;
    this.finalizarCombate();
  };

  abrirMesa2v2 = (): void => {
    this.mostrarTruco2v2 = true;
    this.prepararCombate();
  };
  cerrarMesa2v2 = (): void => {
    this.mostrarTruco2v2 = false;
    this.finalizarCombate();
  };

  abrirMesa3v3 = (): void => {
    this.mostrarTruco3v3 = true;
    this.prepararCombate();
  };
  cerrarMesa3v3 = (): void => {
    this.mostrarTruco3v3 = false;
    this.finalizarCombate();
  };

  abrirMesaMulti = (): void => {
    this.mostrarTrucoMulti = true;
    this.prepararCombate();
  };
  cerrarMesaMulti = (): void => {
    this.mostrarTrucoMulti = false;
    this.finalizarCombate();
  };

  abrirMesa2v2Multi = (): void => {
    this.mostrarTruco2v2Multi = true;
    this.prepararCombate();
  };
  cerrarMesa2v2Multi = (): void => {
    this.mostrarTruco2v2Multi = false;
    this.finalizarCombate();
  };

  abrirMesa3v3Multi = (): void => {
    this.mostrarTruco3v3Multi = true;
    this.prepararCombate();
  };
  cerrarMesa3v3Multi = (): void => {
    this.mostrarTruco3v3Multi = false;
    this.finalizarCombate();
  };

  private prepararCombate(): void {
    this.document.body.classList.add('combate-historia');
    this.historiaService.pausarEscenaMapaActiva();
  }

  private finalizarCombate(): void {
    this.document.body.classList.remove('combate-historia');
    window.dispatchEvent(new CustomEvent('resume-game'));
    this.historiaService.reanudarEscenaMapaTrasCombate();
  }

  private inicializarListeners(): void {
    window.addEventListener('truco-solo:start', this.abrirMesaTruco);
    window.addEventListener('truco-solo:end', this.cerrarMesaTruco);
    window.addEventListener('truco-2v2:start', this.abrirMesa2v2);
    window.addEventListener('truco-2v2:end', this.cerrarMesa2v2);
    window.addEventListener('truco-3v3:start', this.abrirMesa3v3);
    window.addEventListener('truco-3v3:end', this.cerrarMesa3v3);
    window.addEventListener('truco-multi:start', this.abrirMesaMulti);
    window.addEventListener('truco-multi:end', this.cerrarMesaMulti);
    window.addEventListener('truco-2v2-multi:start', this.abrirMesa2v2Multi);
    window.addEventListener('truco-2v2-multi:end', this.cerrarMesa2v2Multi);
    window.addEventListener('truco-3v3-multi:start', this.abrirMesa3v3Multi);
    window.addEventListener('truco-3v3-multi:end', this.cerrarMesa3v3Multi);
  }

  private removerListeners(): void {
    window.removeEventListener('truco-solo:start', this.abrirMesaTruco);
    window.removeEventListener('truco-solo:end', this.cerrarMesaTruco);
    window.removeEventListener('truco-2v2:start', this.abrirMesa2v2);
    window.removeEventListener('truco-2v2:end', this.cerrarMesa2v2);
    window.removeEventListener('truco-3v3:start', this.abrirMesa3v3);
    window.removeEventListener('truco-3v3:end', this.cerrarMesa3v3);
    window.removeEventListener('truco-multi:start', this.abrirMesaMulti);
    window.removeEventListener('truco-multi:end', this.cerrarMesaMulti);
    window.removeEventListener('truco-2v2-multi:start', this.abrirMesa2v2Multi);
    window.removeEventListener('truco-2v2-multi:end', this.cerrarMesa2v2Multi);
    window.removeEventListener('truco-3v3-multi:start', this.abrirMesa3v3Multi);
    window.removeEventListener('truco-3v3-multi:end', this.cerrarMesa3v3Multi);
  }

  ngOnDestroy(): void {
    this.removerListeners();

    localStorage.removeItem('multiEnHistoria');
    localStorage.removeItem('historiaPartida');
    localStorage.removeItem('rivalNivel');
    localStorage.removeItem('origenPulperia');

    this.historiaService.destruirJuego();
    this.document.body.classList.remove('modo-phaser-mobile');
    this.document.body.classList.remove('combate-historia');
  }
}
