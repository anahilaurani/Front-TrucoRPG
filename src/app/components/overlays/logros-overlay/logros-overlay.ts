import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Logro {
  nombre: string;
  descripcion?: string;
  img?: string;
  desbloqueado?: boolean;
}

@Component({
  selector: 'app-logros-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logros-overlay.html',
  styleUrl: './logros-overlay.css',
})
export class LogrosOverlay {
  logros: Logro[] = [];

  get tieneLogros(): boolean {
    return this.logros.length > 0;
  }
}
