import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageWrapper } from '../../components/page-wrapper/page-wrapper';
import { Capitulo } from '../../interfaces/capitulo';
import { CAPITULO } from '../../../game/data/capitulo';

@Component({
  selector: 'app-reglas-truco',
  imports: [RouterLink, PageWrapper],
  templateUrl: './reglas-truco.html',
  styleUrl: './reglas-truco.css',
})
export class ReglasTruco {
  capituloActivo = signal(0);
  animando = signal(false);

  capitulos: Capitulo[] = CAPITULO;

  get capitulo(): Capitulo {
    return this.capitulos[this.capituloActivo()];
  }

  seleccionar(i: number): void {
    if (this.animando() || i === this.capituloActivo()) return;
    this.animando.set(true);
    setTimeout(() => {
      this.capituloActivo.set(i);
      this.animando.set(false);
    }, 260);
  }

  anterior(): void {
    const prev = this.capituloActivo() - 1;
    if (prev >= 0) this.seleccionar(prev);
  }

  siguiente(): void {
    const next = this.capituloActivo() + 1;
    if (next < this.capitulos.length) this.seleccionar(next);
  }

  tagCss(tag?: string): string {
    if (!tag) return '';
    return 'tag-' + tag
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-');
  }
}
