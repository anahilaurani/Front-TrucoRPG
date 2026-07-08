import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Card } from '../../components/card/card';
import { PageWrapper } from '../../components/page-wrapper/page-wrapper';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, Card, PageWrapper],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
})
export class ConfiguracionComponent {
  volumen = Number(localStorage.getItem('cfg_volumen') ?? 70);
  musica = localStorage.getItem('cfg_musica') !== 'false';
  pantallaCompleta = localStorage.getItem('cfg_pantalla') === 'true';
  delaySegundos = Number(localStorage.getItem('cfg_delay') ?? 1200) / 1000;
  velocidad = Number(localStorage.getItem('cfg_velocidad') ?? 250);

  private audio = inject(AudioService);

  constructor(private router: Router) {}

  onVolumenChange(): void {
    this.audio.setVolumen(this.volumen);
  }

  onMusicaChange(): void {
    this.audio.setMusica(this.musica);
  }

  async guardar() {
    localStorage.setItem('cfg_pantalla', String(this.pantallaCompleta));
    localStorage.setItem('cfg_delay', String(Math.round(this.delaySegundos * 1000)));
    localStorage.setItem('cfg_velocidad', String(Math.round(this.velocidad)));

    await this.aplicarPantallaCompleta(this.pantallaCompleta);

    this.router.navigate(['/home']);
  }

  cancelar() {
    this.router.navigate(['/home']);
  }

  private aplicarPantallaCompleta(activar: boolean): Promise<void> {
    const el = document.documentElement;

    if (activar) {
      if (document.fullscreenElement) {
        return Promise.resolve();
      }

      if (el.requestFullscreen) {
        return el.requestFullscreen().catch((err) => {
          console.warn('El navegador bloqueó la pantalla completa o no está permitida:', err);
        });
      } else if ((el as any).webkitRequestFullscreen) {
        return (el as any).webkitRequestFullscreen();
      }
    } else {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          return document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          return (document as any).webkitExitFullscreen();
        }
      }
    }

    return Promise.resolve();
  }
}
