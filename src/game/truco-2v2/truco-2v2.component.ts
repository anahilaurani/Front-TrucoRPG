import {
  Component, OnInit, OnDestroy,
  ChangeDetectorRef, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SalaService } from '../../app/services/sala.service';

// ── Tipos del backend (payload personalizado de TrucoEstado2v2) ───────────────
export interface Carta2v2 { numero: number; palo: string; valorTruco?: number; }

interface Vuelta2v2 {
  cartasJugadas: Record<string, Carta2v2>;
  ganadorVuelta: string | null;
  mejorCartaEquipoA: Carta2v2 | null;
  mejorCartaEquipoB: Carta2v2 | null;
}

/** Estado compartido (camelCase) que viaja dentro de cada mensaje personalizado. */
interface Estado2v2 {
  numeroDeMano: number;
  turnoActual: string;          // 'J1'..'J4'
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

  vueltas: Vuelta2v2[];
  vueltaActual: Vuelta2v2 | null;
}

/** Mensaje personalizado que cada jugador recibe (solo ve sus cartas). */
interface Msg2v2 {
  miRol: string;                // 'J1'..'J4'  → asiento propio
  miEquipo: string;             // 'EquipoA' | 'EquipoB'
  misCartas: Carta2v2[];        // mi mano (boca arriba)
  misJugadas: Carta2v2[];       // mis cartas ya jugadas
  cartasCompanero: Carta2v2[];  // jugadas del compañero
  estado: Estado2v2;
}

// ── Tipos de UI ───────────────────────────────────────────────────────────────
interface MesaJugadas {
  yo: Carta2v2[];
  compa: Carta2v2[];
  izq: Carta2v2[];   // rival de la izquierda
  der: Carta2v2[];   // rival de la derecha
}

interface BtnAccion { label: string; color: string; action: () => void; enabled: boolean; }

type Seat = 'yo' | 'compa' | 'izq' | 'der';

@Component({
  selector: 'app-truco-2v2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './truco-2v2.component.html',
  styleUrls: [
    '../truco-solo/truco-solo.component.css',
    '../truco-solo-2v2/truco-solo-2v2.component.css',
    './truco-2v2.component.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrucoMulti2v2Component implements OnInit, OnDestroy {

  // ── Estado ────────────────────────────────────────────────────
  msg: Msg2v2 | null = null;
  get estado(): Estado2v2 | null { return this.msg?.estado ?? null; }
  get miRol(): string { return this.msg?.miRol ?? 'J1'; }
  get miEquipo(): string { return this.msg?.miEquipo ?? 'EquipoA'; }
  get equipoRival(): string { return this.miEquipo === 'EquipoA' ? 'EquipoB' : 'EquipoA'; }

  // ── UI ────────────────────────────────────────────────────────
  btns: BtnAccion[] = [];
  mesa: MesaJugadas = { yo: [], compa: [], izq: [], der: [] };
  tallySticksNosotros: any[] = [];
  tallySticksEllos:    any[] = [];
  mostrarMenuSenias = false;

  toastMsg = '';
  toastTipo: 'error' | 'info' = 'error';
  mostrarConfirmSalir = false;
  gameOver = false;
  gameOverGanamos = false;

  countdown: number | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private prevGanadorMano: string | null = null;

  readonly fanAngles = [-12, 0, 12];
  readonly fanXOff   = [-18, 0, 18];

  // Burbujas de diálogo por asiento
  dialogos: Record<Seat, { texto?: string; imagen?: string | null } | null> = { yo: null, compa: null, izq: null, der: null };
  private dialogoTimers: Record<Seat, ReturnType<typeof setTimeout> | null> = { yo: null, compa: null, izq: null, der: null };
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

      this.sala.trucoEstado2v2$.subscribe(data => {
        if (data) this.onEstado(data as Msg2v2);
      }),

      this.sala.jugadorDesconectado$.subscribe(v => {
        if (v) this.showToast('Un jugador se desconectó de la partida.');
      }),

      this.sala.seniaRecibida$.subscribe(tipo => {
        if (!tipo) return;
        this.mostrarDialogo('compa', this.getSeniaLabel(tipo), tipo);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.cancelarCountdown();
    for (const k of Object.keys(this.dialogoTimers) as Seat[]) {
      const t = this.dialogoTimers[k];
      if (t) clearTimeout(t);
    }
  }

  // ── Mapeo de asientos relativos a miRol ───────────────────────
  // La ronda gira hacia la derecha: yo → der → compa (arriba) → izq.
  private rolAsiento(seat: Seat): string {
    const p = Number(this.miRol.replace('J', '')) || 1; // 1..4
    const off: Record<Seat, number> = { yo: 0, der: 1, compa: 2, izq: 3 };
    return 'J' + (((p - 1 + off[seat]) % 4) + 1);
  }
  get rolYo():    string { return this.rolAsiento('yo'); }
  get rolCompa(): string { return this.rolAsiento('compa'); }
  get rolDer():   string { return this.rolAsiento('der'); }
  get rolIzq():   string { return this.rolAsiento('izq'); }

  /** ¿El asiento dado es el "mano" de la ronda? */
  esMano(seat: Seat): boolean { return this.estado?.jugadorMano === this.rolAsiento(seat); }

  /** Cartas que le quedan en mano a un asiento (no propio) → para dibujar reversos. */
  cartasEnMano(seat: Seat): number[] {
    const rol = this.rolAsiento(seat);
    const e = this.estado;
    if (!e) return [];
    let jugadas = 0;
    const vueltas = [...(e.vueltas ?? [])];
    if (e.vueltaActual) vueltas.push(e.vueltaActual);
    for (const v of vueltas) if (v.cartasJugadas?.[rol]) jugadas++;
    const quedan = Math.max(0, 3 - jugadas);
    return Array.from({ length: quedan }, (_, i) => i);
  }

  // ── Puntos / textos ───────────────────────────────────────────
  get puntosNosotros(): number {
    const e = this.estado; if (!e) return 0;
    return this.miEquipo === 'EquipoA' ? e.puntosEquipoA : e.puntosEquipoB;
  }
  get puntosEllos(): number {
    const e = this.estado; if (!e) return 0;
    return this.miEquipo === 'EquipoA' ? e.puntosEquipoB : e.puntosEquipoA;
  }
  get estadoEnvido(): string { return this.estado?.estadoEnvido ?? 'No se cantó.'; }
  get estadoTruco():  string { return this.estado?.estadoTruco  ?? 'No se cantó.'; }
  get turnoBadge():   string { return this.calcularTurnoBadge(); }
  get misCartas(): Carta2v2[] { return this.msg?.misCartas ?? []; }

  // ── Procesar estado entrante ──────────────────────────────────
  private onEstado(msg: Msg2v2): void {
    this.msg = msg;
    const e = msg.estado;

    this.mesa = this.buildMesa(e);
    this.buildBtns(e);
    this.redrawTally(this.puntosNosotros, this.puntosEllos);
    this.updateBurbujas(e);

    if (e.partidaTerminada && !this.gameOver) {
      this.gameOver = true;
      this.gameOverGanamos = e.ganadorPartida === this.miEquipo;
    }

    // Nueva mano automática: solo el jugador "mano" dispara la cuenta regresiva
    // (los demás reciben el broadcast). El botón manual queda para todos.
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

  private buildMesa(e: Estado2v2): MesaJugadas {
    const mesa: MesaJugadas = { yo: [], compa: [], izq: [], der: [] };
    const vueltas = [...(e.vueltas ?? [])];
    if (e.vueltaActual) vueltas.push(e.vueltaActual);
    for (const v of vueltas) {
      const cj = v.cartasJugadas ?? {};
      if (cj[this.rolYo])    mesa.yo.push(cj[this.rolYo]);
      if (cj[this.rolCompa]) mesa.compa.push(cj[this.rolCompa]);
      if (cj[this.rolIzq])   mesa.izq.push(cj[this.rolIzq]);
      if (cj[this.rolDer])   mesa.der.push(cj[this.rolDer]);
    }
    return mesa;
  }

  // ── Botones de acción ─────────────────────────────────────────
  private buildBtns(e: Estado2v2): void {
    const btns: BtnAccion[] = [];
    const esMiTurno = e.turnoActual === this.miRol;
    const manoEnd   = e.manoTerminada || !!e.ganadorMano || e.partidaTerminada;

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
      const rivalDeclaro = (e.tantosDeclarados?.[this.rolDer] ?? null) !== null
                        || (e.tantosDeclarados?.[this.rolIzq] ?? null) !== null;
      if (rivalDeclaro)
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

  private calcularTurnoBadge(): string {
    const e = this.estado;
    if (!e) return 'Esperando inicio de partida...';
    if (e.partidaTerminada) return '';
    if (e.manoTerminada) {
      const gan = e.ganadorMano === this.miEquipo ? '¡Ganaron la mano!' : 'Perdieron la mano.';
      return this.countdown != null ? `${gan} Nueva mano en ${this.countdown}...` : gan;
    }
    if (e.trucoPendienteRespuestaDe === this.miRol) return 'Respondé el Truco';
    if (e.envidoPendienteRespuestaDe === this.miRol && e.faseEnvido === 'pendiente_respuesta') return 'Respondé el Envido';
    if (e.envidoPendienteRespuestaDe === this.miRol && e.faseEnvido === 'declarando_tantos') return 'Declarás tus tantos';
    if (e.turnoActual === this.miRol) return 'Tu turno — jugá una carta o cantá';
    if (e.turnoActual === this.rolCompa) return 'Turno de tu compañero...';
    return 'Turno de un rival...';
  }

  // ── Acciones (invocan al hub) ─────────────────────────────────
  jugarCarta(carta: Carta2v2): void {
    const e = this.estado;
    if (!e) return;
    if (e.manoTerminada || e.ganadorMano || e.partidaTerminada) return;
    if (e.trucoPendienteRespuestaDe === this.miRol || e.envidoPendienteRespuestaDe === this.miRol) {
      this.showToast('No podés jugar: primero respondé el canto.', 'info');
      return;
    }
    if (e.turnoActual !== this.miRol) { this.showToast('Esperá tu turno para jugar.', 'info'); return; }
    if (e.trucoPendienteRespuestaDe || e.envidoPendienteRespuestaDe) {
      this.showToast('Esperá la respuesta del canto.', 'info');
      return;
    }
    this.hub('JugarCarta2v2', carta.numero, carta.palo);
  }

  cantarEnvido(tipo: string): void   { this.mostrarDialogo('yo', '¡' + tipo + '!'); this.hub('SolicitarEnvido2v2', tipo); }
  escalarEnvido(tipo: string): void  { this.mostrarDialogo('yo', '¡' + tipo + '!'); this.hub('EscalarEnvido2v2', tipo); }
  responderEnvido(aceptar: boolean): void {
    this.mostrarDialogo('yo', aceptar ? '¡Quiero!' : '¡No quiero!');
    this.hub('ResponderEnvido2v2', aceptar);
  }
  declararTanto(tanto: number): void { this.mostrarDialogo('yo', String(tanto)); this.hub('DeclararTanto2v2', tanto); }
  sonBuenas(): void                  { this.mostrarDialogo('yo', '¡Son buenas!'); this.hub('SonBuenas2v2'); }

  cantarTruco(): void { this.mostrarDialogo('yo', '¡Truco!'); this.hub('SolicitarTruco2v2'); }
  responderTruco(aceptar: boolean, escalarA?: string): void {
    const txt = escalarA
      ? '¡' + (escalarA === 'retruco' ? 'Retruco' : 'Vale cuatro') + '!'
      : (aceptar ? '¡Quiero!' : '¡No quiero!');
    this.mostrarDialogo('yo', txt);
    this.hub('ResponderTruco2v2', aceptar, escalarA ?? null);
  }
  escalarTruco(): void {
    const nombre = this.estado?.nivelTruco === 1 ? 'Retruco' : 'Vale cuatro';
    this.mostrarDialogo('yo', '¡' + nombre + '!');
    this.hub('EscalarTruco2v2');
  }
  irseAlMazo(): void { this.mostrarDialogo('yo', 'Me voy al mazo.'); this.hub('IrseAlMazo2v2'); }
  nuevaMano(): void  { this.cancelarCountdown(); this.gameOver = false; this.hub('NuevaMano2v2'); }

  private hub(method: string, ...args: unknown[]): void {
    this.sala.invocarHub(method, ...args).catch(err => {
      this.showToast(`Error: ${err?.message ?? err}`);
    });
  }

  // ── Cálculo del tanto propio ──────────────────────────────────
  private calcularMiTanto(): number {
    const cartas: Carta2v2[] = [...(this.msg?.misCartas ?? []), ...(this.msg?.misJugadas ?? [])];
    return this.calcularTanto(cartas);
  }
  private calcularTanto(cartas: Carta2v2[]): number {
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
  private updateBurbujas(e: Estado2v2): void {
    const envidoChanged = (e.estadoEnvido ?? '') !== this.prevEstadoEnvido;
    const trucoChanged  = (e.estadoTruco  ?? '') !== this.prevEstadoTruco;

    // Canto de envido pendiente → burbuja en el asiento del cantor (si no soy yo)
    if (envidoChanged && e.envidoCantado && e.envidoPendienteRespuestaDe != null && e.cantorEnvido) {
      const seat = this.seatDeRol(e.cantorEnvido);
      if (seat && seat !== 'yo') {
        const nombres: Record<string, string> = {
          Envido: 'Envido', EnvidoEnvido: 'Envido Envido',
          RealEnvido: 'Real Envido', FaltaEnvido: 'Falta Envido',
        };
        const tipo = nombres[e.tipoEnvidoCantado ?? 'Envido'] ?? e.tipoEnvidoCantado ?? 'Envido';
        this.mostrarDialogo(seat, '¡' + tipo + '!');
      }
    }
    // Canto de truco pendiente → burbuja en el asiento del cantor (si no soy yo)
    if (trucoChanged && e.trucoCantado && e.trucoPendienteRespuestaDe != null && e.cantorTruco) {
      const seat = this.seatDeRol(e.cantorTruco);
      if (seat && seat !== 'yo') {
        const nivel = e.nivelTruco ?? 1;
        const txt = nivel === 1 ? '¡Truco!' : nivel === 2 ? '¡Retruco!' : '¡Vale Cuatro!';
        this.mostrarDialogo(seat, txt);
      }
    }
  }

  private seatDeRol(rol: string): Seat | null {
    if (rol === this.rolYo) return 'yo';
    if (rol === this.rolCompa) return 'compa';
    if (rol === this.rolIzq) return 'izq';
    if (rol === this.rolDer) return 'der';
    return null;
  }

  private mostrarDialogo(seat: Seat, texto: string, tipoSenia?: string): void {
    const imagen = this.seniaImg(tipoSenia);

    if (!texto && !imagen) return;
    this.dialogos[seat] = { texto: texto || this.getSeniaLabel(tipoSenia ?? ''), imagen };
    this.cdr.markForCheck();
    const prev = this.dialogoTimers[seat];
    if (prev) clearTimeout(prev);
    this.dialogoTimers[seat] = setTimeout(() => {
      this.dialogos[seat] = null;
      this.cdr.markForCheck();
    }, 2400);
  }

  private getSeniaLabel(tipo: string): string {
    switch (tipo) {
      case 'anchoEspada': return 'Ancho de Espada';
      case 'anchoBasto': return 'Ancho de Basto';
      case 'sieteEspada': return '7 de Espada';
      case 'sieteOro': return '7 de Oro';
      case 'cualquierTres': return 'Cualquier Tres';
      case 'cualquierDos': return 'Cualquier Dos';
      case 'falsoUno': return 'Falso Uno';
      case 'ninguna': return 'Nada importante';
      default: return tipo;
    }
  }

  private seniaImg(tipo?: string | null): string | null {
    if (!tipo) return null;
    const tiposValidos = ['anchoEspada', 'anchoBasto', 'sieteEspada', 'sieteOro', 'cualquierTres', 'cualquierDos', 'falsoUno', 'ninguna'];
    return tiposValidos.includes(tipo) ? `assets/señas/${tipo}.png` : null;
  }

  // ── Cuenta regresiva nueva mano ───────────────────────────────
  private iniciarCountdown(onComplete: () => void): void {
    this.cancelarCountdown();
    this.countdown = 3;
    this.cdr.markForCheck();
    this.countdownInterval = setInterval(() => {
      this.countdown = (this.countdown ?? 1) - 1;
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

  // ── Tanteador ─────────────────────────────────────────────────
  private redrawTally(ptsNos: number, ptsEll: number): void {
    this.tallySticksNosotros = this.buildTally(ptsNos, '#c8a030');
    this.tallySticksEllos    = this.buildTally(ptsEll, '#d46010');
  }
  private buildTally(pts: number, color: string): any[] {
    const out: any[] = [];
    const capped = Math.min(pts, 30);
    if (capped <= 0) return out;
    this.buildTallyMitad(out, Math.min(capped, 15), color, 6);
    if (capped > 15) this.buildTallyMitad(out, capped - 15, color, 71);
    return out;
  }
  private buildTallyMitad(out: any[], pts: number, color: string, startX: number): void {
    if (pts <= 0) return;
    const full = Math.floor(pts / 5), rem = pts % 5;
    const BS = 14, BGAP = 3, SL = 9, SGAP = 3, y = 19;
    let bx = startX;
    for (let i = 0; i < Math.min(full, 3); i++) { this.addBox(out, bx, y, BS, color); bx += BS + BGAP; }
    if (rem > 0 && full < 3) {
      let sx = bx;
      for (let i = 0; i < rem; i++) { out.push({ x1: sx, y1: y + SL, x2: sx + SL, y2: y, color }); sx += SL + SGAP; }
    }
  }
  private addBox(out: any[], x: number, y: number, s: number, color: string): void {
    out.push({ x1: x,   y1: y+s, x2: x,   y2: y,   color });
    out.push({ x1: x,   y1: y,   x2: x+s, y2: y,   color });
    out.push({ x1: x+s, y1: y,   x2: x+s, y2: y+s, color });
    out.push({ x1: x+s, y1: y+s, x2: x,   y2: y+s, color });
    out.push({ x1: x,   y1: y+s, x2: x+s, y2: y,   color });
  }

  // ── Imagen de carta ───────────────────────────────────────────
  cardImg(c: Carta2v2): string {
    const nums: Record<number, number> = { 1:1,2:2,3:3,4:4,5:5,6:6,7:7,10:8,11:9,12:10 };
    const palos: Record<string, number> = { Oro:0, Copa:10, Espada:20, Basto:30 };
    return `assets/cards/${(palos[c.palo] ?? 0) + (nums[c.numero] ?? 1)}.PNG`;
  }

  // ── Game over / salir ─────────────────────────────────────────
  salirPartida():  void { this.mostrarConfirmSalir = true; }
  cancelarSalir(): void { this.mostrarConfirmSalir = false; }
  async confirmarSalir(): Promise<void> {
    this.mostrarConfirmSalir = false;
    await this.sala.abandonar();
    // Desde historia: cerrar el overlay y volver a la pulpería (sin navegar).
    if (localStorage.getItem('multiEnHistoria') === '1') {
      localStorage.removeItem('multiEnHistoria');
      window.dispatchEvent(new CustomEvent('truco-2v2-multi:end'));
      return;
    }
    const volverASala = localStorage.getItem('origenSalaMulti') === '1';
    localStorage.removeItem('origenSalaMulti');
    this.router.navigate([volverASala ? '/multijugador-mapa' : '/home']);
  }

  private showToast(msg: string, tipo: 'error' | 'info' = 'error'): void {
    this.toastMsg  = msg;
    this.toastTipo = tipo;
    this.cdr.markForCheck();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastMsg = ''; this.cdr.markForCheck(); }, tipo === 'info' ? 2600 : 4000);
  }

  abrirMenuSenias() {
    this.mostrarMenuSenias = !this.mostrarMenuSenias;
    this.cdr.markForCheck();
  }

  enviarSenia(tipo: string): void {
    this.mostrarDialogo('yo', this.getSeniaLabel(tipo), tipo);
    this.hub('EnviarSenia2v2', tipo);
    this.mostrarMenuSenias = false;
  }

  /* c#
  public async Task EnviarSenia2v2(string tipo)
  {
      var jugador = ObtenerJugadorActual();
      var companero = ObtenerCompanero(jugador);

      await Clients.Client(companero.ConnectionId)
          .SendAsync("RecibirSenia", tipo);
  }

  var companero = ObtenerCompanero(jugadorActual);
  await Clients.Client(companero.ConnectionId)
    .SendAsync("RecibirSena", sena);
  */
}
