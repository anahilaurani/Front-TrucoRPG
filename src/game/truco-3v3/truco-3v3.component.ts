import {
  Component, OnInit, OnDestroy,
  ChangeDetectorRef, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SalaService } from '../../app/services/sala.service';

// ── Tipos del backend (payload personalizado de TrucoEstado3v3) ──────────────
export interface Carta3v3 { numero: number; palo: string; valorTruco?: number; }

interface Vuelta3v3 {
  cartasJugadas: Record<string, Carta3v3>;
  ganadorVuelta: string | null;
}

/** Estado compartido (camelCase) que viaja dentro de cada mensaje personalizado. */
interface Estado3v3 {
  numeroDeMano: number;
  turnoActual: string;          // 'J1'..'J6'
  jugadorMano: string;
  equipoMano: string;           // 'EquipoA' | 'EquipoB'
  ganadorMano: string | null;   // 'EquipoA' | 'EquipoB'
  manoTerminada: boolean;
  partidaTerminada: boolean;
  ganadorPartida: string | null;

  puntosEquipoA: number;
  puntosEquipoB: number;

  // Envido
  estadoEnvido: string | null;
  estadoTruco: string | null;
  envidoCantado: boolean;
  envidoResuelto: boolean;
  tipoEnvidoCantado: string | null;
  cantorEnvido: string | null;
  ganadorEnvido: string | null;
  puntosEnvido: number;
  puntosEnvidoNoQuiero: number;
  faseEnvido: string | null;    // 'pendiente_respuesta' | 'declarando_tantos' | ...
  envidoPendienteRespuestaDe: string | null;
  sonBuenasDeclarado: boolean;
  tantosDeclarados: Record<string, number | null>;

  // Truco
  trucoCantado: boolean;
  trucoResuelto: boolean;
  nivelTruco: number;
  puntosTrucoMano: number;
  cantorTruco: string | null;
  equipoCantorTruco: string | null;
  trucoPendienteRespuestaDe: string | null;
  puedeEscalarTruco: string | null;

  vueltas: Vuelta3v3[];
  vueltaActual: Vuelta3v3 | null;

  // Pica-Pica
  picaPica: boolean;
  picaPicaSlot: number;
  jugadoresActivos: string[];
}

/** Mensaje personalizado que cada jugador recibe (solo ve sus cartas). */
interface Msg3v3 {
  miRol: string;                       // 'J1'..'J6' → asiento propio
  miEquipo: string;                    // 'EquipoA' | 'EquipoB'
  misCartas: Carta3v3[];
  misJugadas: Carta3v3[];
  cartasCompaneros: Record<string, Carta3v3[]>;
  estado: Estado3v3;
}

interface AsientoRival {
  rol: string;
  nombre: string;
  equipo: 'nosotros' | 'ellos';
  cartasEnMano: number;
  activo: boolean;                     // false = mira el duelo Pica-Pica
}

interface BtnAccion { label: string; color: string; action: () => void; enabled: boolean; }

@Component({
  selector: 'app-truco-3v3',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './truco-3v3.component.html',
  styleUrls: [
    '../truco-solo/truco-solo.component.css',
    '../truco-2v2/truco-2v2.component.css',
    './truco-3v3.component.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Truco3v3Component implements OnInit, OnDestroy {

  // ── Estado ────────────────────────────────────────────────────
  msg: Msg3v3 | null = null;
  get estado(): Estado3v3 | null { return this.msg?.estado ?? null; }
  get miRol(): string { return this.msg?.miRol ?? 'J1'; }
  get miEquipo(): string { return this.msg?.miEquipo ?? 'EquipoA'; }
  get equipoRival(): string { return this.miEquipo === 'EquipoA' ? 'EquipoB' : 'EquipoA'; }

  // ── Asiento propio (abajo) ────────────────────────────────────
  yoNombre = 'VOS';
  get misCartas(): Carta3v3[] { return this.msg?.misCartas ?? []; }

  readonly fanAngles = [-14, 0, 14];
  readonly fanXOff   = [-22, 0, 22];

  // ── Asientos relativos (se recalculan con cada estado) ────────
  // frente = +3, derecha (arriba→abajo) = [+2, +1], izquierda (arriba→abajo) = [+4, +5]
  frente: AsientoRival      = this.placeholder('J4');
  izquierda: AsientoRival[] = [this.placeholder('J5'), this.placeholder('J3')];
  derecha: AsientoRival[]   = [this.placeholder('J6'), this.placeholder('J2')];

  // ── UI ────────────────────────────────────────────────────────
  btns: BtnAccion[] = [];
  /** Cartas jugadas en la mesa por rol ('J1'..'J6'). */
  mesa: Record<string, Carta3v3[]> = { J1: [], J2: [], J3: [], J4: [], J5: [], J6: [] };

  puntosNosotros = 0;
  puntosEllos    = 0;
  estadoEnvido = 'No se cantó.';
  estadoTruco  = 'No se cantó.';
  turnoBadge   = 'Esperando inicio de partida...';
  picaPicaBanner = '';
  mostrarMenuSenias = false;

  gameOver = false;
  gameOverGanamos = false;
  mostrarConfirmSalir = false;
  toastMsg = '';
  toastTipo: 'error' | 'info' = 'error';

  countdown: number | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private prevGanadorMano: string | null = null;

  // Burbujas de diálogo por rol ('J1'..'J6')
  dialogos: Record<string, { texto: string } | null> = {};
  private dialogoTimers: Record<string, ReturnType<typeof setTimeout> | null> = {};
  private prevEstadoEnvido = '';
  private prevEstadoTruco  = '';

  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private subs: Subscription[] = [];

  constructor(
    private sala: SalaService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.sala.trucoEstado3v3$.subscribe(data => {
        if (data) this.onEstado(data as Msg3v3);
      }),
      this.sala.jugadorDesconectado$.subscribe(v => {
        if (v) this.showToast('Un jugador se desconectó de la partida.');
      }),
    );

    this.sala.seniaRecibida$.subscribe(tipo => {
        if (!tipo) return;
        this.mostrarDialogo(
          'compa',
          `👁 ${tipo}`
        );
      })
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.cancelarCountdown();
    for (const k of Object.keys(this.dialogoTimers)) {
      const t = this.dialogoTimers[k];
      if (t) clearTimeout(t);
    }
  }

  // ── Procesar estado entrante ──────────────────────────────────
  private onEstado(msg: Msg3v3): void {
    this.msg = msg;
    const e = msg.estado;

    this.frente    = this.armarAsiento(this.rolAsiento(3));
    this.derecha   = [this.armarAsiento(this.rolAsiento(2)), this.armarAsiento(this.rolAsiento(1))];
    this.izquierda = [this.armarAsiento(this.rolAsiento(4)), this.armarAsiento(this.rolAsiento(5))];

    this.mesa = this.buildMesa(e);
    this.buildBtns(e);
    this.updateBurbujas(e);

    this.puntosNosotros = this.miEquipo === 'EquipoA' ? e.puntosEquipoA : e.puntosEquipoB;
    this.puntosEllos    = this.miEquipo === 'EquipoA' ? e.puntosEquipoB : e.puntosEquipoA;
    this.estadoEnvido   = e.estadoEnvido ?? 'No se cantó.';
    this.estadoTruco    = e.estadoTruco  ?? 'No se cantó.';
    this.picaPicaBanner = this.calcularPicaPicaBanner(e);
    this.turnoBadge     = this.calcularTurnoBadge(e);

    if (e.partidaTerminada && !this.gameOver) {
      this.gameOver = true;
      this.gameOverGanamos = e.ganadorPartida === this.miEquipo;
    }

    // Nueva mano automática: solo el jugador "mano" dispara la cuenta regresiva.
    if (e.ganadorMano && !e.partidaTerminada) {
      if (e.ganadorMano !== this.prevGanadorMano && this.miRol === e.jugadorMano) {
        this.iniciarCountdown(() => {
          if (this.estado?.ganadorMano && !this.estado?.partidaTerminada) this.nuevaMano();
        });
      }
    } else {
      this.cancelarCountdown();
    }
    this.prevGanadorMano = e.ganadorMano ?? null;

    this.prevEstadoEnvido = e.estadoEnvido ?? '';
    this.prevEstadoTruco  = e.estadoTruco  ?? '';

    this.cdr.markForCheck();
  }

  // ── Mapeo de asientos relativos a miRol ───────────────────────
  // Offset 0 = yo (abajo); +1..+5 girando horario (a la derecha).
  private rolAsiento(offset: number): string {
    const p = Number(this.miRol.replace('J', '')) || 1; // 1..6
    return 'J' + (((p - 1 + offset) % 6) + 1);
  }

  private armarAsiento(rol: string): AsientoRival {
    const equipo: 'nosotros' | 'ellos' = this.mismoEquipo(rol) ? 'nosotros' : 'ellos';
    return {
      rol,
      nombre: rol,
      equipo,
      cartasEnMano: this.cartasEnMano(rol),
      activo: this.esActivo(rol),
    };
  }

  /** ¿El rol participa de esta mano? (en Pica-Pica solo juegan 2). */
  esActivo(rol: string): boolean {
    const e = this.estado;
    if (!e || !e.picaPica) return true;
    return (e.jugadoresActivos ?? []).includes(rol);
  }

  get soyActivo(): boolean { return this.esActivo(this.miRol); }

  /** Cartas que le quedan en mano a un rol → para dibujar reversos. */
  private cartasEnMano(rol: string): number {
    const e = this.estado;
    if (!e) return 3;
    if (!this.esActivo(rol)) return 0;
    let jugadas = 0;
    const vueltas = [...(e.vueltas ?? [])];
    if (e.vueltaActual) vueltas.push(e.vueltaActual);
    for (const v of vueltas) if (v.cartasJugadas?.[rol]) jugadas++;
    return Math.max(0, 3 - jugadas);
  }

  /** EquipoA = J1/J3/J5 (impares), EquipoB = J2/J4/J6 (pares). */
  private mismoEquipo(rol: string): boolean {
    const n  = Number(rol.replace('J', ''));
    const yo = Number(this.miRol.replace('J', ''));
    return (n % 2) === (yo % 2);
  }

  /** ¿El rol dado es el "mano" de la ronda? */
  esMano(rol: string): boolean { return this.estado?.jugadorMano === rol; }

  // ── Mesa (cartas jugadas por rol) ─────────────────────────────
  private buildMesa(e: Estado3v3): Record<string, Carta3v3[]> {
    const mesa: Record<string, Carta3v3[]> = {};
    for (let i = 1; i <= 6; i++) mesa['J' + i] = [];
    const vueltas = [...(e.vueltas ?? [])];
    if (e.vueltaActual) vueltas.push(e.vueltaActual);
    for (const v of vueltas) {
      const cj = v.cartasJugadas ?? {};
      for (const rol of Object.keys(cj)) (mesa[rol] ??= []).push(cj[rol]);
    }
    return mesa;
  }

  // ── Botones de acción ─────────────────────────────────────────
  private buildBtns(e: Estado3v3): void {
    const btns: BtnAccion[] = [];
    const esMiTurno = e.turnoActual === this.miRol;
    const manoEnd   = e.manoTerminada || !!e.ganadorMano || e.partidaTerminada;

    // En Pica-Pica, si no soy duelista solo miro (sin acciones de juego).
    if (!this.soyActivo) {
      if (manoEnd && !e.partidaTerminada)
        btns.push({ label: 'NUEVA MANO', color: '#cc8800', enabled: true, action: () => this.nuevaMano() });
      this.btns = btns;
      return;
    }

    const yaJugue = (this.msg?.misJugadas?.length ?? 0) > 0;
    const envidoDisponible =
      !e.envidoCantado && !e.envidoResuelto && (e.vueltas?.length ?? 0) === 0 && !yaJugue
      && (
        !e.trucoCantado
        // "Envido va primero": solo contra el PRIMER truco del rival, aún sin responder.
        || (e.trucoPendienteRespuestaDe === this.miRol
            && e.nivelTruco === 1
            && e.equipoCantorTruco === this.equipoRival)
      );

    // ── Responder envido ──────────────────────────────────────
    if (e.envidoPendienteRespuestaDe === this.miRol && e.faseEnvido === 'pendiente_respuesta') {
      btns.push({ label: 'QUIERO', color: '#44ff44', enabled: true, action: () => this.responderEnvido(true) });
      const tipo = e.tipoEnvidoCantado ?? 'Envido';
      if (tipo === 'Envido')
        btns.push({ label: 'ENVIDO', color: '#4488ff', enabled: true, action: () => this.escalarEnvido('Envido Envido') });
      if (tipo === 'Envido' || tipo === 'EnvidoEnvido')
        btns.push({ label: 'REAL ENVIDO', color: '#4488ff', enabled: true, action: () => this.escalarEnvido('Real Envido') });
      if (tipo !== 'FaltaEnvido' && tipo !== 'Falta Envido')
        btns.push({ label: 'FALTA ENVIDO', color: '#4488ff', enabled: true, action: () => this.escalarEnvido('Falta Envido') });
      btns.push({ label: 'NO QUIERO', color: '#ff4444', enabled: true, action: () => this.responderEnvido(false) });
    }
    // ── Declarar tanto ────────────────────────────────────────
    else if (e.envidoPendienteRespuestaDe === this.miRol && e.faseEnvido === 'declarando_tantos') {
      const tanto = this.calcularMiTanto();
      btns.push({ label: `TENGO ${tanto}`, color: '#44ff44', enabled: true, action: () => this.declararTanto(tanto) });
      if (this.algunRivalDeclaro(e))
        btns.push({ label: 'SON BUENAS', color: '#ffaa00', enabled: true, action: () => this.sonBuenas() });
    }
    // ── Esperando que otros resuelvan el envido ──────────────
    else if ((e.faseEnvido === 'pendiente_respuesta' || e.faseEnvido === 'declarando_tantos')
              && e.envidoPendienteRespuestaDe != null) {
      // sin botones — no me toca
    }
    // ── Responder truco ───────────────────────────────────────
    else if (e.trucoPendienteRespuestaDe === this.miRol) {
      btns.push({ label: 'QUIERO', color: '#44ff44', enabled: true, action: () => this.responderTruco(true) });
      if ((e.nivelTruco ?? 0) < 3 && e.puedeEscalarTruco === this.miRol) {
        const lbl = e.nivelTruco === 1 ? 'RETRUCO' : 'VALE 4';
        const esc = e.nivelTruco === 1 ? 'retruco' : 'valecuatro';
        btns.push({ label: lbl, color: '#ffaa00', enabled: true, action: () => this.responderTruco(true, esc) });
      }
      btns.push({ label: 'NO QUIERO', color: '#ff4444', enabled: true, action: () => this.responderTruco(false) });
      if (envidoDisponible) {
        btns.push({ label: 'Envido', color: '#4488ff', enabled: true, action: () => this.cantarEnvido('Envido') });
        btns.push({ label: 'Real Envido', color: '#4488ff', enabled: true, action: () => this.cantarEnvido('Real Envido') });
        btns.push({ label: 'Falta Envido', color: '#4488ff', enabled: true, action: () => this.cantarEnvido('Falta Envido') });
      }
    }
    // ── Mano terminada (partida en curso) ─────────────────────
    else if (e.manoTerminada && !e.partidaTerminada) {
      btns.push({ label: 'NUEVA MANO', color: '#cc8800', enabled: true, action: () => this.nuevaMano() });
    }
    // ── Turno normal ──────────────────────────────────────────
    else if (!manoEnd) {
      if (envidoDisponible) {
        btns.push({ label: 'Envido', color: '#4488ff', enabled: esMiTurno, action: () => this.cantarEnvido('Envido') });
        btns.push({ label: 'Real Envido', color: '#4488ff', enabled: esMiTurno, action: () => this.cantarEnvido('Real Envido') });
        btns.push({ label: 'Falta Envido', color: '#4488ff', enabled: esMiTurno, action: () => this.cantarEnvido('Falta Envido') });
      }
      if (!e.trucoCantado) {
        btns.push({ label: 'Truco', color: '#dd4422', enabled: esMiTurno, action: () => this.cantarTruco() });
      } else if (
        e.trucoPendienteRespuestaDe == null &&
        (e.nivelTruco ?? 0) >= 1 && (e.nivelTruco ?? 0) < 3 &&
        e.equipoCantorTruco !== this.miEquipo
      ) {
        const lbl = e.nivelTruco === 1 ? 'Retruco' : 'Vale 4';
        btns.push({ label: lbl, color: '#ffaa00', enabled: esMiTurno, action: () => this.escalarTruco() });
      }
      btns.push({ label: 'Ir al mazo', color: '#884422', enabled: esMiTurno, action: () => this.irseAlMazo() });
    }

    this.btns = btns;
  }

  /** ¿Algún rival ya declaró su tanto? (habilita "son buenas"). */
  private algunRivalDeclaro(e: Estado3v3): boolean {
    for (let i = 1; i <= 6; i++) {
      const rol = 'J' + i;
      if (this.mismoEquipo(rol)) continue;
      if ((e.tantosDeclarados?.[rol] ?? null) !== null) return true;
    }
    return false;
  }

  private calcularPicaPicaBanner(e: Estado3v3): string {
    if (!e.picaPica) return '';
    const duelo = (e.jugadoresActivos ?? []).join(' vs ');
    return `PICA-PICA · ${duelo}`;
  }

  private calcularTurnoBadge(e: Estado3v3): string {
    if (e.partidaTerminada) return '';
    if (e.manoTerminada || e.ganadorMano) {
      const gan = e.ganadorMano === this.miEquipo ? '¡Ganaron la mano!' : 'Perdieron la mano.';
      return this.countdown != null ? `${gan} Nueva mano en ${this.countdown}...` : gan;
    }
    if (!this.soyActivo) return `Duelo Pica-Pica: mirás desde afuera. Turno de ${e.turnoActual}...`;
    if (e.trucoPendienteRespuestaDe === this.miRol) return 'Respondé el Truco';
    if (e.envidoPendienteRespuestaDe === this.miRol && e.faseEnvido === 'pendiente_respuesta') return 'Respondé el Envido';
    if (e.envidoPendienteRespuestaDe === this.miRol && e.faseEnvido === 'declarando_tantos') return 'Declarás tus tantos';
    if (e.turnoActual === this.miRol) return 'Tu turno — jugá una carta o cantá';
    if (this.mismoEquipo(e.turnoActual)) return `Turno de tu compañero ${e.turnoActual}...`;
    return `Turno del rival ${e.turnoActual}...`;
  }

  private placeholder(rol: string): AsientoRival {
    return { rol, nombre: rol, equipo: 'ellos', cartasEnMano: 3, activo: true };
  }

  // Helper para dibujar N reversos
  reversos(n: number): number[] { return Array.from({ length: n }, (_, i) => i); }

  // ── Acciones (invocan al hub) ─────────────────────────────────
  jugarCarta(carta: Carta3v3): void {
    const e = this.estado;
    if (!e) return;
    if (e.manoTerminada || e.ganadorMano || e.partidaTerminada) return;
    if (!this.soyActivo) { this.showToast('Estás mirando el duelo Pica-Pica.'); return; }
    if (e.trucoPendienteRespuestaDe === this.miRol || e.envidoPendienteRespuestaDe === this.miRol) {
      this.showToast('No podés jugar: primero respondé el canto.', 'info');
      return;
    }
    if (e.turnoActual !== this.miRol) { this.showToast('Esperá tu turno para jugar.', 'info'); return; }
    if (e.trucoPendienteRespuestaDe || e.envidoPendienteRespuestaDe) {
      this.showToast('Esperá la respuesta del canto.', 'info');
      return;
    }
    this.hub('JugarCarta3v3', carta.numero, carta.palo);
  }

  cantarEnvido(tipo: string): void   { this.mostrarDialogo(this.miRol, '¡' + tipo + '!'); this.hub('SolicitarEnvido3v3', tipo); }
  escalarEnvido(tipo: string): void  { this.mostrarDialogo(this.miRol, '¡' + tipo + '!'); this.hub('EscalarEnvido3v3', tipo); }
  responderEnvido(aceptar: boolean): void {
    this.mostrarDialogo(this.miRol, aceptar ? '¡Quiero!' : '¡No quiero!');
    this.hub('ResponderEnvido3v3', aceptar);
  }
  declararTanto(tanto: number): void { this.mostrarDialogo(this.miRol, String(tanto)); this.hub('DeclararTanto3v3', tanto); }
  sonBuenas(): void                  { this.mostrarDialogo(this.miRol, '¡Son buenas!'); this.hub('SonBuenas3v3'); }

  cantarTruco(): void { this.mostrarDialogo(this.miRol, '¡Truco!'); this.hub('SolicitarTruco3v3'); }
  responderTruco(aceptar: boolean, escalarA?: string): void {
    const txt = escalarA
      ? '¡' + (escalarA === 'retruco' ? 'Retruco' : 'Vale cuatro') + '!'
      : (aceptar ? '¡Quiero!' : '¡No quiero!');
    this.mostrarDialogo(this.miRol, txt);
    this.hub('ResponderTruco3v3', aceptar, escalarA ?? null);
  }
  escalarTruco(): void {
    const nombre = this.estado?.nivelTruco === 1 ? 'Retruco' : 'Vale cuatro';
    this.mostrarDialogo(this.miRol, '¡' + nombre + '!');
    this.hub('EscalarTruco3v3');
  }
  irseAlMazo(): void { this.mostrarDialogo(this.miRol, 'Me voy al mazo.'); this.hub('IrseAlMazo3v3'); }
  nuevaMano(): void  { this.cancelarCountdown(); this.gameOver = false; this.hub('NuevaMano3v3'); }

  private hub(method: string, ...args: unknown[]): void {
    this.sala.invocarHub(method, ...args).catch(err => {
      this.showToast(`Error: ${err?.message ?? err}`);
    });
  }

  // ── Cálculo del tanto propio ──────────────────────────────────
  private calcularMiTanto(): number {
    const cartas: Carta3v3[] = [...(this.msg?.misCartas ?? []), ...(this.msg?.misJugadas ?? [])];
    if (cartas.length === 0) return 0;
    const grupos: Record<string, number[]> = {};
    for (const c of cartas) {
      const v = c.numero >= 10 ? 0 : c.numero;
      (grupos[c.palo] ??= []).push(v);
    }
    let mejor = 0;
    for (const vals of Object.values(grupos)) {
      const sorted = [...vals].sort((a, b) => b - a);
      if (sorted.length >= 2) mejor = Math.max(mejor, sorted[0] + sorted[1] + 20);
    }
    if (mejor > 0) return mejor;
    return Math.max(...cartas.map(c => (c.numero >= 10 ? 0 : c.numero)), 0);
  }

  // ── Burbujas de canto ─────────────────────────────────────────
  private updateBurbujas(e: Estado3v3): void {
    const envidoChanged = (e.estadoEnvido ?? '') !== this.prevEstadoEnvido;
    const trucoChanged  = (e.estadoTruco  ?? '') !== this.prevEstadoTruco;

    // Canto de envido pendiente → burbuja en el asiento del cantor (si no soy yo)
    if (envidoChanged && e.envidoCantado && e.envidoPendienteRespuestaDe != null && e.cantorEnvido
        && e.cantorEnvido !== this.miRol) {
      const nombres: Record<string, string> = {
        Envido: 'Envido', EnvidoEnvido: 'Envido Envido',
        RealEnvido: 'Real Envido', FaltaEnvido: 'Falta Envido',
      };
      const tipo = nombres[e.tipoEnvidoCantado ?? 'Envido'] ?? e.tipoEnvidoCantado ?? 'Envido';
      this.mostrarDialogo(e.cantorEnvido, '¡' + tipo + '!');
    }
    // Canto de truco pendiente → burbuja en el asiento del cantor (si no soy yo)
    if (trucoChanged && e.trucoCantado && e.trucoPendienteRespuestaDe != null && e.cantorTruco
        && e.cantorTruco !== this.miRol) {
      const nivel = e.nivelTruco ?? 1;
      const txt = nivel === 1 ? '¡Truco!' : nivel === 2 ? '¡Retruco!' : '¡Vale Cuatro!';
      this.mostrarDialogo(e.cantorTruco, txt);
    }
  }

  private mostrarDialogo(rol: string, texto: string): void {
    if (!texto) return;
    this.dialogos[rol] = { texto };
    this.cdr.markForCheck();
    const prev = this.dialogoTimers[rol];
    if (prev) clearTimeout(prev);
    this.dialogoTimers[rol] = setTimeout(() => {
      this.dialogos[rol] = null;
      this.cdr.markForCheck();
    }, 2400);
  }

  // ── Cuenta regresiva nueva mano ───────────────────────────────
  private iniciarCountdown(onComplete: () => void): void {
    this.cancelarCountdown();
    this.countdown = 3;
    this.cdr.markForCheck();
    this.countdownInterval = setInterval(() => {
      this.countdown = (this.countdown ?? 1) - 1;
      if (this.estado) this.turnoBadge = this.calcularTurnoBadge(this.estado);
      this.cdr.markForCheck();
      if ((this.countdown ?? 0) <= 0) {
        this.cancelarCountdown();
        onComplete();
      }
    }, 1000);
  }
  private cancelarCountdown(): void {
    if (this.countdownInterval) { clearInterval(this.countdownInterval); this.countdownInterval = null; }
    this.countdown = null;
  }

  // ── Imagen de carta ───────────────────────────────────────────
  cardImg(c: Carta3v3): string {
    const nums: Record<number, number> = { 1:1,2:2,3:3,4:4,5:5,6:6,7:7,10:8,11:9,12:10 };
    const palos: Record<string, number> = { Oro:0, Copa:10, Espada:20, Basto:30 };
    return `assets/cards/${(palos[c.palo] ?? 0) + (nums[c.numero] ?? 1)}.PNG`;
  }

  // ── Salir ─────────────────────────────────────────────────────
  salirPartida():  void { this.mostrarConfirmSalir = true; }
  cancelarSalir(): void { this.mostrarConfirmSalir = false; }
  async confirmarSalir(): Promise<void> {
    this.mostrarConfirmSalir = false;
    await this.sala.abandonar();
    this.router.navigate(['/home']);
  }

  private showToast(msg: string, tipo: 'error' | 'info' = 'error'): void {
    this.toastMsg  = msg;
    this.toastTipo = tipo;
    this.cdr.markForCheck();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastMsg = ''; this.cdr.markForCheck(); }, tipo === 'info' ? 2600 : 4000);
  }

  abrirMenuSenias() {
    this.mostrarMenuSenias = true;
  }

  enviarSenia(tipo: string): void {
    this.hub('EnviarSenia2v2', tipo);
    this.mostrarMenuSenias = false;
  }
}
