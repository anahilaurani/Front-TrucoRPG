import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { HEROES } from '../../../game/data/heroes';
import { PulperiaUiService } from '../../services/pulperiaOverlay/pulperia-overlay-config';

@Component({
  selector: 'app-seleccion-personaje',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seleccion-personaje.html',
  styleUrl: './seleccion-personaje.css',
})
export class SeleccionPersonaje {
  @Input() standalone = true;
  @Input() volverRuta: string | null = null;

  heroes = HEROES;
  selectedHeroId: number | null = null;
  readonly esTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  @Output() heroeConfirmado = new EventEmitter<number>();
  @Output() solicitarVolver = new EventEmitter<void>();

  constructor(
    private location: Location,
    private router: Router,
    protected uiService: PulperiaUiService,
  ) {}

  seleccionarHeroe(id: number): void {
    this.selectedHeroId = id;
  }

  elegirOtro(): void {
    this.selectedHeroId = null;
  }

  enviarConfirmacion(): void {
    if (this.selectedHeroId !== null) {
      this.heroeConfirmado.emit(this.selectedHeroId);
    }
  }

  volver(): void {
    if (this.volverRuta) {
      this.router.navigateByUrl(this.volverRuta).catch(() => this.location.back());
      return;
    }

    if (!this.standalone) {
      this.solicitarVolver.emit();
    } else {
      this.location.back();
    }
  }
}
