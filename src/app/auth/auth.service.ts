import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  token: string;
}

export interface UsuarioInfo {
  nombre: string;
  email:  string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/api/auth`;

  readonly avatarUrl = signal<string | null>(localStorage.getItem('avatarUrl'));
  readonly usuario = signal<UsuarioInfo | null>(this.leerUsuarioDesdeToken());

  setAvatar(url: string | null): void {
    if (url) localStorage.setItem('avatarUrl', url);
    else localStorage.removeItem('avatarUrl');
    this.avatarUrl.set(url);
  }

  constructor(private http: HttpClient) {}

  registrar(data: RegisterRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/register`, data);
  }

  login(data: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/login`, data);
  }

  guardarToken(token: string): void {
    this.limpiarDatosDeSesionAnterior();
    localStorage.setItem('token', token);
    this.usuario.set(this.leerUsuarioDesdeToken());
  }

  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  /** Está autenticado solo si hay token y NO está vencido. */
  estaAutenticado(): boolean {
    return !!this.obtenerToken() && !this.tokenVencido();
  }

  /** true si el token existe y su claim `exp` ya pasó (o es ilegible). */
  tokenVencido(): boolean {
    const payload = this.obtenerPayload();
    if (!payload) return false; // sin token legible: no lo tratamos como vencido acá
    if (!payload.exp) return false; // sin exp: no podemos afirmar que venció
    // `exp` viene en segundos (epoch). Margen de 5s para expirar un toque antes.
    const margenMs = 5000;
    return payload.exp * 1000 <= Date.now() + margenMs;
  }

  obtenerUsuario(): UsuarioInfo | null {
    return this.usuario();
  }

  private obtenerPayload(): any | null {
    const token = this.obtenerToken();
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  private leerUsuarioDesdeToken(): UsuarioInfo | null {
    const payload = this.obtenerPayload();
    if (!payload) return null;
    return {
      nombre: payload['name']
        ?? payload['unique_name']
        ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
        ?? '',
      email: payload['email']
        ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
        ?? '',
    };
  }

  /** Datos de partida/historia del usuario anterior; no deben mezclarse entre cuentas. */
  private limpiarDatosDeSesionAnterior(): void {
    //localStorage.removeItem('avatarUrl');
    this.avatarUrl.set(null);

    const clavesSesion = [
      'heroeId',
      'historiaPartida',
      'rivalNivel',
      'origenPulperia',
      'origenSalaMulti',
      'multiEnHistoria',
      'historia_vista_actual',
      'historiaMapaEscena',
      'practicaEscenario',
    ];
    for (const clave of clavesSesion) {
      localStorage.removeItem(clave);
    }
  }

  cambiarPassword(passwordActual: string, passwordNueva: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/changePassword`, {
      passwordActual,
      passwordNueva,
    });
  }

  solicitarResetPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/forgotPassword`, { email });
  }

  resetPassword(email: string, token: string, nuevaPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/resetPassword`, {
      email,
      token,
      nuevaPassword,
    });
  }

  cerrarSesion(): void {
    this.limpiarDatosDeSesionAnterior();
    localStorage.removeItem('token');
    this.usuario.set(null);
  }
}
