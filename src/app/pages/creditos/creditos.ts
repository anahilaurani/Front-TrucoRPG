import { ChangeDetectorRef, Component, EventEmitter, inject, OnDestroy, OnInit, Output } from '@angular/core';
import { CREDITOS_SLIDES, CREDITOS_STAFF } from './creditos-slides';

@Component({
  selector: 'app-creditos',
  standalone: true,
  imports: [],
  templateUrl: './creditos.html',
  styleUrl: './creditos.css',
})
export class Creditos implements OnInit, OnDestroy {
  @Output() creditosTerminado = new EventEmitter<void>();

  private cdr = inject(ChangeDetectorRef);

  // ── Narrativa (typewriter, igual que el prólogo) ──────────────────────────
  slides = CREDITOS_SLIDES;
  slideActual = 0;
  textoMostrado = '';
  typewriterDone = false;
  private intervalo: any;

  // ── Roll de staff ──────────────────────────────────────────────────────────
  staff = CREDITOS_STAFF;
  mostrandoStaff = false;

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
      this.cdr.markForCheck();
    }, 38);
  }

  siguiente() {
    if (this.mostrandoStaff) {
      this.creditosTerminado.emit();
      return;
    }

    if (!this.typewriterDone) {
      clearInterval(this.intervalo);
      this.textoMostrado = this.slides[this.slideActual];
      this.typewriterDone = true;
      this.cdr.markForCheck();
      return;
    }

    if (this.slideActual < this.slides.length - 1) {
      this.slideActual++;
      this.iniciarTypewriter();
    } else {
      this.mostrandoStaff = true;
    }
    this.cdr.markForCheck();
  }

  get esUltimaSlide() {
    return this.slideActual === this.slides.length - 1;
  }

  saltar() {
    clearInterval(this.intervalo);
    if (this.mostrandoStaff) {
      this.creditosTerminado.emit();
    } else {
      this.mostrandoStaff = true;
    }
    this.cdr.markForCheck();
  }

  ngOnDestroy() {
    clearInterval(this.intervalo);
  }
}