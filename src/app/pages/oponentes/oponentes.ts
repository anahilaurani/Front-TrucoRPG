import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Oponente } from '../../interfaces/oponenteInterface';
import { OPONENTES } from '../../../game/data/oponente';
import { PageWrapper } from "../../components/page-wrapper/page-wrapper";

@Component({
  selector: 'app-oponentes',
  imports: [RouterLink, PageWrapper],
  templateUrl: './oponentes.html',
  styleUrl: './oponentes.css',
})
export class Oponentes {
  oponenteActivo = signal<number>(0);
  animando = signal<boolean>(false);

  oponentes: Oponente[] = OPONENTES;

  get oponente(): Oponente {
    return this.oponentes[this.oponenteActivo()];
  }

  seleccionar(i: number): void {
    if (this.animando() || i === this.oponenteActivo()) return;
    
    this.animando.set(true);
    setTimeout(() => {
      this.oponenteActivo.set(i);
      this.animando.set(false);
    }, 260);
  }

  anterior(): void {
    const prev = this.oponenteActivo() - 1;
    if (prev >= 0) this.seleccionar(prev);
  }

  siguiente(): void {
    const next = this.oponenteActivo() + 1;
    if (next < this.oponentes.length) this.seleccionar(next);
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