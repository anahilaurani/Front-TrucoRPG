import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { PERSONAJES } from '../../../game/data/personaje';
import { HABILIDADES } from '../../../game/data/habilidades';

interface Habilidad {
  id: string;
  nombre: string;
  pasiva: string;
  activa: string;
}

@Component({
  selector: 'app-seleccion-personaje-historia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seleccion-personaje-historia.html',
  styleUrl: './seleccion-personaje-historia.css',
})
export class SeleccionPersonajeHistoria implements OnInit {
  @Input() standalone = true;
  @Input() volverRuta: string | null = null;

  heroes = PERSONAJES;
  currentIndex = 0;

  habilidadesOpciones: Habilidad[] = HABILIDADES.map((h) => ({
    id: h.id,
    nombre: h.nombre,
    pasiva: h.pasiva,
    activa: h.activa,
  }));

  selectedHeroId: number | null = null;
  selectedAbilityId: string | null = null;
  pasoActual: number = 1;
  habilidadEnVista: Habilidad | null = null;
  private mazoIndex = -1;

  readonly esTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  @Output() heroeConfirmado = new EventEmitter<{ heroeId: number; habilidad: string }>();
  @Output() solicitarVolver = new EventEmitter<void>();

  constructor(
    private location: Location,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.actualizarSeleccion();
  }

  anteriorPersonaje(): void {
    if (this.pasoActual !== 1) return;
    this.currentIndex = this.currentIndex === 0 ? this.heroes.length - 1 : this.currentIndex - 1;
    this.actualizarSeleccion();
  }

  siguientePersonaje(): void {
    if (this.pasoActual !== 1) return;
    this.currentIndex = this.currentIndex === this.heroes.length - 1 ? 0 : this.currentIndex + 1;
    this.actualizarSeleccion();
  }

  actualizarSeleccion(): void {
    this.selectedHeroId = this.heroes[this.currentIndex].id;
  }

  avanzarAlMazo(): void {
    this.pasoActual = 2;
  }

  seleccionarHeroe(id: number): void {
    this.selectedHeroId = id;
    const index = this.heroes.findIndex((h) => h.id === id);
    if (index !== -1) {
      this.currentIndex = index;
    }
  }

  revelarSiguienteHabilidad(): void {
    if (this.habilidadesOpciones.length === 0) return;
    this.mazoIndex++;
    if (this.mazoIndex >= this.habilidadesOpciones.length) {
      this.mazoIndex = 0;
    }
    this.habilidadEnVista = this.habilidadesOpciones[this.mazoIndex];
  }

  seleccionarHabilidad(idHabilidad: string): void {
    this.selectedAbilityId = idHabilidad;
  }

  get heroeEnPantalla() {
    return this.heroes[this.currentIndex];
  }

  elegirOtro(): void {
    this.pasoActual = 1;
    this.currentIndex = 0;
    this.actualizarSeleccion();
    this.selectedAbilityId = null;
    this.habilidadEnVista = null;
    this.mazoIndex = -1;
  }

  enviarConfirmacion(): void {
    if (this.selectedHeroId !== null && this.selectedAbilityId !== null) {
      this.heroeConfirmado.emit({
        heroeId: this.selectedHeroId,
        habilidad: this.selectedAbilityId,
      });
    }
  }

  volver(): void {
    if (this.pasoActual === 2 && !this.esTouch) {
      this.pasoActual = 1;
      this.selectedAbilityId = null;
      this.habilidadEnVista = null;
      this.mazoIndex = -1;
      return;
    }

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
