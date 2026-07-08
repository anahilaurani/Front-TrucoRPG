import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { PageWrapper } from '../../components/page-wrapper/page-wrapper';
import { Card } from '../../components/card/card';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, PageWrapper, Card],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit {
  email            = '';
  token            = '';
  passwordNueva    = '';
  passwordConfirmar = '';
  cargando         = false;
  exito            = false;
  error            = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.email || !this.token) {
      this.error = 'Link inválido o expirado.';
    }
  }

  resetear(): void {
    this.error = '';

    if (!this.passwordNueva || !this.passwordConfirmar) {
      this.error = 'Completá todos los campos.'; return;
    }
    if (this.passwordNueva !== this.passwordConfirmar) {
      this.error = 'Las contraseñas no coinciden.'; return;
    }
    if (this.passwordNueva.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres.'; return;
    }

    this.cargando = true;
    this.auth.resetPassword(this.email, this.token, this.passwordNueva).subscribe({
      next: () => { this.cargando = false; this.exito = true; },
      error: (err) => {
        this.cargando = false;
        this.error = err?.error?.message ?? 'No se pudo restablecer la contraseña.';
      },
    });
  }

  irAlLogin(): void {
    this.router.navigate(['/login']);
  }
}
