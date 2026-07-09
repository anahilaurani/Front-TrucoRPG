import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface JugadorEquipo {
  posicion: number;
  equipo: 'sanMartin' | 'belgrano' | null;
}

export interface EstadoEquipos {
  miPosicion: number;
  jugadores: JugadorEquipo[];
  equiposListos: boolean;
  countSanMartin: number;
  countBelgrano: number;
}

export interface LobbyActualizado {
  jugadoresEnSala: number;
  maxJugadores: number;
}

export interface LobbyListos {
  listos: number;
  requeridos: number;
}

export interface SalaPublicaInfo {
  codigo: string;
  modo: string;
  jugadores: number;
  maxJugadores: number;
}

@Injectable({ providedIn: 'root' })
export class SalaService {
  private hub: signalR.HubConnection;

  // ── 1v1 observables ─────────────────────────────────────────
  codigoSala$          = new BehaviorSubject<string>('');
  salaLista$           = new BehaviorSubject<boolean>(false);
  miListo$             = new BehaviorSubject<boolean>(false);
  juegoIniciado$       = new BehaviorSubject<boolean>(false);
  jugadorDesconectado$ = new BehaviorSubject<boolean>(false);
  trucoEstado$         = new BehaviorSubject<unknown>(null);
  error$               = new BehaviorSubject<string>('');

  // ── 2v2 observables ─────────────────────────────────────────
  salaCompleta$      = new BehaviorSubject<boolean>(false);
  lobbyActualizado$  = new BehaviorSubject<LobbyActualizado | null>(null);
  estadoEquipos$     = new BehaviorSubject<EstadoEquipos | null>(null);
  equiposListos$     = new BehaviorSubject<boolean>(false);
  miPosicion$        = new BehaviorSubject<number>(0);
  lobbyListos$       = new BehaviorSubject<LobbyListos | null>(null);
  /** Estado del juego 2v2 multijugador (para TrucoMulti2v2Component) */
  trucoEstado2v2$    = new BehaviorSubject<unknown>(null);
  juegoIniciado2v2$  = new BehaviorSubject<boolean>(false);

  // ── 3v3 observables ─────────────────────────────────────────
  /** Estado del juego 3v3 multijugador (para Truco3v3Component) */
  trucoEstado3v3$    = new BehaviorSubject<unknown>(null);
  juegoIniciado3v3$  = new BehaviorSubject<boolean>(false);

  constructor(private auth: AuthService) {
    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(environment.hubUrl, {
        accessTokenFactory: () => this.auth.obtenerToken() ?? '',
        skipNegotiation: false,
      })
      .withAutomaticReconnect()
      .build();

    // ── 1v1 events ─────────────────────────────────────────────
    this.hub.on('SalaLista', () => {
      this.salaLista$.next(true);
    });

    this.hub.on('TrucoEstado', (data: unknown) => {
      if (!this.juegoIniciado$.value) this.juegoIniciado$.next(true);
      this.trucoEstado$.next(data);
    });

    this.hub.on('JugadorDesconectado', () => {
      this.salaLista$.next(false);
      this.miListo$.next(false);
      this.jugadorDesconectado$.next(true);
    });

    // ── 2v2 events ─────────────────────────────────────────────
    this.hub.on('SalaCompleta', () => {
      this.salaCompleta$.next(true);
    });

    this.hub.on('LobbyActualizado', (data: LobbyActualizado) => {
      this.lobbyActualizado$.next(data);
    });

    this.hub.on('EstadoEquipos', (data: EstadoEquipos) => {
      this.miPosicion$.next(data.miPosicion);
      this.estadoEquipos$.next(data);
      this.equiposListos$.next(data.equiposListos);
    });

    this.hub.on('LobbyListos', (data: LobbyListos) => {
      this.lobbyListos$.next(data);
    });

    // ── 2v2 game events ────────────────────────────────────────
    this.hub.on('TrucoEstado2v2', (data: unknown) => {
      if (!this.juegoIniciado2v2$.value) this.juegoIniciado2v2$.next(true);
      // También dispara juegoIniciado$ para que la navegación funcione
      if (!this.juegoIniciado$.value) this.juegoIniciado$.next(true);
      this.trucoEstado2v2$.next(data);
    });

    // ── 3v3 game events ────────────────────────────────────────
    this.hub.on('TrucoEstado3v3', (data: unknown) => {
      if (!this.juegoIniciado3v3$.value) this.juegoIniciado3v3$.next(true);
      if (!this.juegoIniciado$.value) this.juegoIniciado$.next(true);
      this.trucoEstado3v3$.next(data);
    });
  }

  async conectar(): Promise<void> {
    // Esperar a que termine cualquier transición en curso (Connecting / Reconnecting /
    // Disconnecting). Si no esperamos, un invoke posterior dispara
    // "Cannot send data if the connection is not in the 'Connected' State".
    const enTransicion = () =>
      this.hub.state === signalR.HubConnectionState.Connecting ||
      this.hub.state === signalR.HubConnectionState.Reconnecting ||
      this.hub.state === signalR.HubConnectionState.Disconnecting;

    let intentos = 0;
    while (enTransicion() && intentos++ < 50) {
      await new Promise((r) => setTimeout(r, 100));
    }

    if (this.hub.state === signalR.HubConnectionState.Disconnected) {
      await this.hub.start();
    }
  }

  async crearSala(modo: '1v1' | '2v2' | '3v3' = '1v1', publica = false): Promise<string> {
    const codigo = await this.hub.invoke<string>('CrearSala', modo, publica);
    this.codigoSala$.next(codigo);
    window.dispatchEvent(new CustomEvent('sala-lista-actualizada'));
    return codigo;
  }

  /** Lista las salas públicas con lugar disponible para el modo dado. */
  async listarSalasPublicas(modo: '1v1' | '2v2' | '3v3' = '1v1'): Promise<SalaPublicaInfo[]> {
    return await this.hub.invoke<SalaPublicaInfo[]>('ListarSalasPublicas', modo);
  }

  /**
   * Se une a una sala por código. Si se pasa `modoEsperado`, el servidor
   * rechaza el código cuando la sala pertenece a otro modo (1v1/2v2/3v3).
   */
  async unirseASala(codigo: string, modoEsperado?: '1v1' | '2v2' | '3v3'): Promise<boolean> {
    const ok = await this.hub.invoke<boolean>('UnirseASala', codigo.toUpperCase().trim(), modoEsperado ?? null);
    if (ok) {
      this.codigoSala$.next(codigo.toUpperCase().trim());
    }
    return ok;
  }

  async elegirEquipo(equipo: 'sanMartin' | 'belgrano'): Promise<void> {
    await this.hub.invoke('ElegirEquipo', equipo);
  }

  async listoParaJugar(): Promise<void> {
    this.miListo$.next(true);
    await this.hub.invoke('ListoParaJugar');
  }

  async invocarHub(method: string, ...args: unknown[]): Promise<void> {
    await this.hub.invoke(method, ...args);
  }

  async abandonar(): Promise<void> {
    // Avisar al servidor explícitamente antes de desconectar
    try { await this.hub.invoke('AbandonarSala'); } catch { /* ignore */ }
    this.reset();
    try { await this.hub.stop(); } catch { /* ignore */ }
    // Disparar DESPUÉS de stop para que el servidor ya haya limpiado la sala
    window.dispatchEvent(new CustomEvent('sala-lista-actualizada'));
  }

  reset(): void {
    this.codigoSala$.next('');
    this.salaLista$.next(false);
    this.miListo$.next(false);
    this.juegoIniciado$.next(false);
    this.jugadorDesconectado$.next(false);
    this.trucoEstado$.next(null);
    this.error$.next('');
    // 2v2
    this.salaCompleta$.next(false);
    this.lobbyActualizado$.next(null);
    this.estadoEquipos$.next(null);
    this.equiposListos$.next(false);
    this.miPosicion$.next(0);
    this.lobbyListos$.next(null);
    this.trucoEstado2v2$.next(null);
    this.juegoIniciado2v2$.next(false);
    this.trucoEstado3v3$.next(null);
    this.juegoIniciado3v3$.next(false);
  }
}
