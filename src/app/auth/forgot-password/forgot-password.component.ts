import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { PageWrapper } from '../../components/page-wrapper/page-wrapper';
import { Card } from '../../components/card/card';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, PageWrapper, Card],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  email     = '';
  enviado   = false;
  cargando  = false;
  error     = '';

  constructor(private auth: AuthService) {}

  enviar(): void {
    this.error = '';
    if (!this.email) { this.error = 'Ingresá tu email.'; return; }

    this.cargando = true;
    this.auth.solicitarResetPassword(this.email).subscribe({
      next: () => { this.cargando = false; this.enviado = true; },
      error: () => { this.cargando = false; this.enviado = true; }, // mismo mensaje por seguridad
    });
  }
}
