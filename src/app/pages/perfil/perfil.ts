import { Component, inject, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';

const HEROES: Record<number, { nombre: string; color: string; descripcion: string }> = {
  0: { nombre: 'Manipulador', color: '#aa66ff', descripcion: 'Cada 3 manos: reemplazá 1 carta por otra del mazo (nunca de menor valor).' },
  1: { nombre: 'Timbero',     color: '#ffaa44', descripcion: 'Antes de jugar: apostá. Si ganás la mano, duplicás puntos; si perdés, rival +2.' },
  2: { nombre: 'Fanfarrón',   color: '#44aaff', descripcion: 'Tu próximo envido o truco aceptado vale +1 punto extra.' },
  3: { nombre: 'Mentiroso',   color: '#66dd88', descripcion: 'Cada 2 manos: al inicio, revelás 1 carta aleatoria del rival.' },
};

export const AVATARES = [
  { src: 'assets/avatares-desarrolladores/Melina-avatar.jpeg',   nombre: 'Melina'   },
  { src: 'assets/avatares-desarrolladores/Lucia-avatar.jpeg',    nombre: 'Lucía'    },
  { src: 'assets/avatares-desarrolladores/Agustin-avatar.jpeg',  nombre: 'Agustín'  },
  { src: 'assets/avatares-desarrolladores/Guido-avatar.jpeg',    nombre: 'Guido'    },
  { src: 'assets/avatares-desarrolladores/Gabriel-avatar.jpeg',  nombre: 'Gabriel'  },
  { src: 'assets/avatares-desarrolladores/Gonzalo-avatar.jpeg',  nombre: 'Gonzalo'  },
  { src: 'assets/avatares-desarrolladores/Gabriela-avatar.jpeg', nombre: 'Gabriela' },
  { src: 'assets/avatares-desarrolladores/Anahi-avatar.jpeg',    nombre: 'Anahí'    },
  { src: 'assets/avatares-desarrolladores/Pilar-avatar.jpeg',    nombre: 'Pilar'    },
];

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class PerfilComponent {
  private authService = inject(AuthService);
  private router      = inject(Router);

  usuario    = this.authService.usuario;
  inicial    = computed(() => this.usuario()?.nombre?.charAt(0).toUpperCase() ?? '?');
  avatarUrl  = computed(() => this.authService.avatarUrl());
  heroe      = computed(() => {
    const id = localStorage.getItem('heroeId');
    if (id === null) return null;
    return HEROES[parseInt(id, 10)] ?? null;
  });

  readonly avatares    = AVATARES;
  pickerAbierto        = signal(false);

  formPassAbierto  = false;
  passwordActual   = '';
  passwordNueva    = '';
  passwordConfirmar = '';
  mensajePass      = '';
  errorPass        = false;
  guardandoPass    = false;

  seleccionarAvatar(src: string): void {
    this.authService.setAvatar(src);
    this.pickerAbierto.set(false);
  }

  quitarAvatar(): void {
    this.authService.setAvatar(null);
    this.pickerAbierto.set(false);
  }

  toggleFormPass(): void {
    this.formPassAbierto = !this.formPassAbierto;
    this.mensajePass = '';
    this.passwordActual = '';
    this.passwordNueva = '';
    this.passwordConfirmar = '';
  }

  cambiarPassword(): void {
    this.mensajePass = '';
    this.errorPass = false;

    if (!this.passwordActual || !this.passwordNueva || !this.passwordConfirmar) {
      this.errorPass = true;
      this.mensajePass = 'Completá todos los campos.';
      return;
    }

    if (this.passwordNueva !== this.passwordConfirmar) {
      this.errorPass = true;
      this.mensajePass = 'Las contraseñas nuevas no coinciden.';
      return;
    }

    if (this.passwordNueva.length < 6) {
      this.errorPass = true;
      this.mensajePass = 'La nueva contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.guardandoPass = true;

    this.authService.cambiarPassword(this.passwordActual, this.passwordNueva).subscribe({
      next: (res) => {
        this.guardandoPass = false;
        this.errorPass = false;
        this.mensajePass = res.message ?? 'Contraseña actualizada correctamente.';
        this.passwordActual = '';
        this.passwordNueva = '';
        this.passwordConfirmar = '';
      },
      error: (err) => {
        this.guardandoPass = false;
        this.errorPass = true;
        this.mensajePass = err?.error?.message ?? err?.error?.title ?? 'No se pudo cambiar la contraseña.';
      },
    });
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.router.navigate(['/']);
  }
}
