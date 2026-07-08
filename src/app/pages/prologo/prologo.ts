import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { PROLOGO_SLIDES } from './prologo-slides';

@Component({
  selector: 'app-prologo',
  standalone: true,
  imports: [],
  templateUrl: './prologo.html',
  styleUrl: './prologo.css',
})
export class Prologo implements OnInit, OnDestroy {
  @Output() prologoTerminado = new EventEmitter<void>();

  slides = PROLOGO_SLIDES;
  slideActual = 0;
  textoMostrado = '';
  typewriterDone = false;
  private intervalo: any;

  ngOnInit() {
    this.iniciarTypewriter();
  }

  iniciarTypewriter() {
    this.textoMostrado = '';
    this.typewriterDone = false;
    const texto = this.slides[this.slideActual];
    let i = 0;
    this.intervalo = setInterval(() => {
      this.textoMostrado += texto[i];
      i++;
      if (i >= texto.length) {
        clearInterval(this.intervalo);
        this.typewriterDone = true;
      }
    }, 38);
  }

  siguiente() {
    if (!this.typewriterDone) {
      clearInterval(this.intervalo);
      this.textoMostrado = this.slides[this.slideActual];
      this.typewriterDone = true;
      return;
    }

    if (this.slideActual < this.slides.length - 1) {
      this.slideActual++;
      this.iniciarTypewriter();
    } else {
      this.prologoTerminado.emit();
    }
  }

  get esUltimaSlide() {
    return this.slideActual === this.slides.length - 1;
  }

  saltar() {
    clearInterval(this.intervalo);
    this.prologoTerminado.emit();
  }

  ngOnDestroy() {
    clearInterval(this.intervalo);
  }
}
