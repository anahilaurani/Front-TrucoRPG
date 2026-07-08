import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast/toast.service';

/**
 * Contenedor visual de las notificaciones. Se monta una sola vez en `app.html`
 * y renderiza los toasts que publica `ToastService`.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class ToastComponent {
  private toastService = inject(ToastService);

  readonly toasts = this.toastService.toasts;

  cerrar(id: number): void {
    this.toastService.cerrar(id);
  }

  icono(tipo: string): string {
    switch (tipo) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      default:
        return 'ℹ';
    }
  }
}
