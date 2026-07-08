import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SalaService } from '../../services/sala.service';
import { ToastService } from '../../services/toast/toast.service';

/**
 * Destino del deep-link del QR (`/unirse?code=ABC123&mode=2v2`).
 * Conecta y se une a la sala automáticamente, y después navega al lobby.
 * Si falla, muestra el error y un botón para ir al menú de unirse.
 */
@Component({
  selector: 'app-unirse-qr',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unirse-qr.html',
  styleUrl: './unirse-qr.css',
})
export class UnirseQrComponent implements OnInit {
  estado: 'uniendo' | 'error' = 'uniendo';
  mensaje = 'Uniéndote a la sala...';
  private gameMode: '1v1' | '2v2' | '3v3' = '1v1';

  constructor(
    private sala: SalaService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService,
  ) {}

  async ngOnInit(): Promise<void> {
    const codigo = (this.route.snapshot.queryParamMap.get('code') ?? '').toUpperCase().trim();
    this.gameMode = (this.route.snapshot.queryParamMap.get('mode') as any) ?? '1v1';

    if (codigo.length < 6) {
      this.fallar('Código de sala inválido.');
      return;
    }

    try {
      this.sala.reset();
      await this.sala.conectar();
      const ok = await this.sala.unirseASala(codigo);
      if (!ok) {
        this.fallar('Sala no encontrada o llena.');
        return;
      }
      this.router.navigate(['/menu-multijugador-tradicional-sala'], {
        queryParams: { mode: 'unirse', gameMode: this.gameMode },
      });
    } catch {
      this.fallar('Error de conexión. Verificá que el servidor esté activo.');
    }
  }

  private fallar(msg: string): void {
    this.estado = 'error';
    this.mensaje = msg;
    this.toast.error(msg);
  }

  irAlMenu(): void {
    this.router.navigate(['/menu-multijugador-tradicional'], {
      queryParams: { gameMode: this.gameMode },
    });
  }
}
