import { Injectable, signal } from '@angular/core';

export type ToastTipo = 'error' | 'success' | 'info';

export interface Toast {
  id: number;
  tipo: ToastTipo;
  mensaje: string;
}

/**
 * Servicio global de notificaciones (toasts).
 *
 * Centraliza el feedback de errores/éxitos para usarlo dentro de los `catch`
 * de servicios y componentes, en lugar de fallar en silencio o repetir lógica
 * de mensajes inline en cada pantalla.
 *
 * Uso:
 *   private toast = inject(ToastService);
 *   ...
 *   } catch {
 *     this.toast.error('No se pudo conectar con el servidor.');
 *   }
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  /** Lista reactiva de toasts visibles (la consume ToastComponent). */
  readonly toasts = signal<Toast[]>([]);

  private contador = 0;

  /** Muestra un toast de error (rojo). Duración por defecto: 5 s. */
  error(mensaje: string, duracionMs = 5000): void {
    this.mostrar('error', mensaje, duracionMs);
  }

  /** Muestra un toast de éxito (verde). Duración por defecto: 3 s. */
  success(mensaje: string, duracionMs = 3000): void {
    this.mostrar('success', mensaje, duracionMs);
  }

  /** Muestra un toast informativo (azul). Duración por defecto: 4 s. */
  info(mensaje: string, duracionMs = 4000): void {
    this.mostrar('info', mensaje, duracionMs);
  }

  /** Cierra manualmente un toast por id (al tocar la X). */
  cerrar(id: number): void {
    this.toasts.update((lista) => lista.filter((t) => t.id !== id));
  }

  private mostrar(tipo: ToastTipo, mensaje: string, duracionMs: number): void {
    const id = ++this.contador;
    this.toasts.update((lista) => [...lista, { id, tipo, mensaje }]);

    if (duracionMs > 0) {
      setTimeout(() => this.cerrar(id), duracionMs);
    }
  }
}
