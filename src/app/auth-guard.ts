import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estaAutenticado()) {
    return true;
  }

  // Token ausente o vencido: limpiamos la sesión vieja y mandamos al login
  // (evita que se dispare una request sin credenciales válidas y falle con 400).
  authService.cerrarSesion();
  router.navigate(['/login']);
  return false;
};
