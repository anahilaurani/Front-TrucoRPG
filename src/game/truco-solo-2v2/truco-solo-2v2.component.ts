import {
  Component, OnInit, OnDestroy,
  ChangeDetectorRef, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

// ── Tipos del backend ─────────────────────────────────────────────
export interface Carta2v2 { numero: number; palo: string; valorTruco: number; }

interface Jugador2v2 {
  id: string; nombre: string; esMaquina: boolean;
  mano: Carta2v2[]; jugadas: Carta2v2[];
}

interface Vuelta2v2 {
  cartasJugadas: Record<string, Carta2v2>;
  ganadorVuelta: string | null;
  mejorCartaEquipoA: Carta2v2 | null;
  mejorCartaEquipoB: Carta2v2 | null;
}

interface Equipo2v2 {
  id: string; nombre: string;
  jugador1: Jugador2v2; jugador2: Jugador2v2;
}

export interface ManoTruco2v2 {
  id: string;
  numeroDeMano: number;
  posicion1: Jugador2v2;
  posicion2: Jugador2v2;
  posicion3: Jugador2v2;
  posicion4: Jugador2v2;
  equipoA: Equipo2v2;
  equipoB: Equipo2v2;

  turnoActual: string;
  jugadorMano: string;
  equipoMano: string;

  vueltas: Vuelta2v2[];
  vueltaActual: Vuelta2v2 | null;
  ganadorMano: string | null;
  manoTerminada: boolean;

  // Envido
  envidoCantado: boolean;
  envidoResuelto: boolean;
  cantorEnvido: string | null;
  tipoEnvidoCantado: string | null;
  ganadorEnvido: string | null;
  puntosEnvido: number;
  estadoEnvido: string | null;
  envidoPendienteRespuestaDe: string | null;
  faseEnvido: string | null;
  tantosDeclarados: Record<string, number | null>;
  tantosReales: Record<string, number>;
  sonBuenasDeclarado: boolean;
  indiceDeclaracionTanto: number;

  // Truco
  trucoCantado: boolean;
  trucoResuelto: boolean;
  cantorTruco: string | null;
  equipoCantorTruco: string | null;
  nivelTruco: number;
  puntosTrucoMano: number;
  estadoTruco: string | null;
  trucoPendienteRespuestaDe: string | null;
  puedeEscalarTruco: string | null;

  // Puntos
  puntosEquipoA: number;
  puntosEquipoB: number;
  partidaTerminada: boolean;
  ganadorPartida: string | null;

  // Consulta de envido del compañero (modo solo 2v2)
  compaConsultaEnvido: boolean;
  compaEnvidoConsultado: boolean;
  compaConsultaTruco: boolean;
  compaTrucoConsultado: boolean;
  compaPista: string | null;
  // Orden del humano: el compañero bot debe jugar su carta más alta en su próximo turno.
  ordenJugarMayor: string | null;
}

// ── Tipos de UI ───────────────────────────────────────────────────
interface MesaJugadas {
  yo: Carta2v2[];
  compa: Carta2v2[];
  izq: Carta2v2[];   // rival izquierda (J4)
  der: Carta2v2[];   // rival derecha (J2)
}

interface BtnAccion {
  label: string; color: string;
  action: () => void;
  enabled: boolean;
}

interface EventoMaquina { jugador: string; tipo: string; texto: string; }
interface PasoResponse  { mano: ManoTruco2v2; evento: EventoMaquina | null; }

const API = '/api/truco2v2';

@Component({
  selector: 'app-truco-solo-2v2',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './truco-solo-2v2.component.html',
  styleUrls: [
    '../truco-solo/truco-solo.component.css',
    '../truco-2v2/truco-2v2.component.css',
    './truco-solo-2v2.component.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrucoSolo2v2Component implements OnInit, OnDestroy {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private cdr    = inject(ChangeDetectorRef);

  // ── Estado del juego ─────────────────────────────────────────
  mano: ManoTruco2v2 | null = null;

  // ── UI ────────────────────────────────────────────────────────
  btns: BtnAccion[] = [];
  mesa: MesaJugadas = { yo: [], compa: [], izq: [], der: [] };
  tantoInput = 0;
  mostrarInputTanto = false;
  mostrarConfirmSalir = false;
  mostrarAcciones = false;
  toastMsg = '';
  toastTipo: 'error' | 'info' = 'error';
  gameOver = false;
  gameOverGanamos = false;

  // Compañeros a los que el humano puede dar órdenes (en 2v2 solo J3).
  readonly companerosAcciones = [
    { id: 'J3', nombre: 'J3 · Compañero' },
  ];

  // Nueva mano automática con cuenta regresiva (como en el solitario)
  countdown: number | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private nuevaManoTimer: ReturnType<typeof setTimeout> | null = null;
  private prevGanadorMano: string | null = null;

  readonly fanAngles = [-12, 0, 12];
  readonly fanXOff   = [-18, 0, 18];

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Diálogos por jugador (burbujas) ──────────────────────────
  dialogos: Record<string, { texto: string } | null> = { J1: null, J2: null, J3: null, J4: null };
  private dialogoTimers: Record<string, ReturnType<typeof setTimeout> | null> = { J1: null, J2: null, J3: null, J4: null };
  private maquinasCorriendo = false;
  private ultimaPista: string | null = null;
  private trucoReanudadoKey: string | null = null;

  // ── Helpers para template ─────────────────────────────────────
  get yo():     Jugador2v2 | null  { return this.mano?.posicion1 ?? null; }
  get compa():  Jugador2v2 | null  { return this.mano?.posicion3 ?? null; }
  // La ronda va hacia la DERECHA: tras VOS (J1) juega el rival de la derecha (J2),
  // luego el compañero (J3, arriba) y luego el rival de la izquierda (J4).
  get rival1(): Jugador2v2 | null  { return this.mano?.posicion4 ?? null; } // asiento IZQUIERDA
  get rival2(): Jugador2v2 | null  { return this.mano?.posicion2 ?? null; } // asiento DERECHA

  /** True si el jugador dado es el "mano" de la ronda (abre y juega primero tras una parda). */
  esMano(id: string): boolean { return this.mano?.jugadorMano === id; }

  get puntosNosotros(): number { return this.mano?.puntosEquipoA ?? 0; }
  get puntosEllos():    number { return this.mano?.puntosEquipoB ?? 0; }
  get estadoEnvido():   string { return this.mano?.estadoEnvido ?? 'No se cantó.'; }
  get estadoTruco():    string { return this.mano?.estadoTruco  ?? 'No se cantó.'; }
  get turnoBadge():     string { return this.calcularTurnoBadge(); }

  tallySticksNosotros: any[] = [];
  tallySticksEllos:    any[] = [];

  // ── Init ──────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    await this.nuevaPartida();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.cancelarCountdown();
    for (const k of Object.keys(this.dialogoTimers)) {
      const t = this.dialogoTimers[k];
      if (t) clearTimeout(t);
    }
  }

  // ── Acciones del humano ───────────────────────────────────────
  async jugarCarta(carta: Carta2v2): Promise<void> {
    if (!this.mano) return;
    if (this.mano.manoTerminada || this.mano.ganadorMano || this.mano.partidaTerminada) {
      this.showToast('La mano ha sido terminada.');
      return;
    }
    if (this.mano.trucoPendienteRespuestaDe === 'J1' ||
        (this.mano.envidoPendienteRespuestaDe === 'J1' &&
         (this.mano.faseEnvido === 'pendiente_respuesta' || this.mano.faseEnvido === 'declarando_tantos'))) {
      this.showToast('No podés jugar: primero respondé el canto.', 'info');
      return;
    }
    if (this.mano.turnoActual !== 'J1') { this.showToast('Esperá tu turno para jugar.', 'info'); return; }
    await this.call('jugar-carta', { manoId: this.mano.id, numero: carta.numero, palo: carta.palo });
  }

  // ── Cuenta regresiva para la nueva mano automática ────────────
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
    if (this.nuevaManoTimer)    { clearTimeout(this.nuevaManoTimer);     this.nuevaManoTimer = null; }
    this.countdown = null;
  }

  // ── Auto-jugar la última carta cuando la mano ya está ganada ──
  private autoJugando = false;

  private intentarAutoJugarSiManoGanada(mano: ManoTruco2v2): void {
    if (this.autoJugando) return;
    if (mano.turnoActual !== 'J1' || mano.manoTerminada || mano.ganadorMano || mano.partidaTerminada) return;
    if (mano.trucoPendienteRespuestaDe || mano.envidoPendienteRespuestaDe) return;
    if (mano.faseEnvido === 'pendiente_respuesta' || mano.faseEnvido === 'declarando_tantos') return;
    if (!this.yo || this.yo.mano.length === 0) return;

    const va = mano.vueltaActual;
    if (!va) return;
    const cj = va.cartasJugadas;
    // Ambos rivales ya jugaron su carta en esta vuelta.
    if (!cj['J2'] || !cj['J4']) return;
    const mejorRival = Math.max(cj['J2'].valorTruco, cj['J4'].valorTruco);
    // Mejor carta que ya tiró mi equipo en esta vuelta (el compañero; yo todavía no jugué).
    const cartasEquipo = [cj['J1'], cj['J3']].filter(Boolean) as Carta2v2[];
    const mejorEquipo = cartasEquipo.length ? Math.max(...cartasEquipo.map(c => c.valorTruco)) : -1;
    if (mejorEquipo <= mejorRival) return; // mi equipo todavía no tiene ganada la vuelta

    // ¿Ganar esta vuelta nos da la mano? (si no, mi carta todavía importa)
    const proyectado = [...mano.vueltas.map(v => v.ganadorVuelta), 'EquipoA'];
    if (this.resolverGanadorMano(proyectado, mano.equipoMano) !== 'EquipoA') return;

    // Mano ya ganada → juego mi carta más baja automáticamente.
    this.autoJugando = true;
    const baja = [...this.yo.mano].sort((a, b) => a.valorTruco - b.valorTruco)[0];
    setTimeout(async () => {
      this.autoJugando = false;
      if (this.mano?.turnoActual === 'J1' && !this.mano?.manoTerminada) {
        await this.jugarCarta(baja);
      }
    }, 800);
  }

  /** Réplica de la resolución de ganador de mano del backend (para anticipar la mano ganada). */
  private resolverGanadorMano(g: (string | null)[], equipoMano: string): string | null {
    const g1 = g[0] ?? null, g2 = g[1] ?? null, g3 = g[2] ?? null;
    if (g1 === 'EquipoA' || g1 === 'EquipoB') {
      if (g2 === g1) return g1;
      if (g2 === 'Parda') return g1;
      if (g2 && g2 !== g1 && g2 !== 'Parda') {
        if (g3 == null) return null;
        if (g3 === 'Parda') return g1;
        return g3;
      }
    }
    if (g1 === 'Parda') {
      if (g2 === 'EquipoA' || g2 === 'EquipoB') return g2;
      if (g2 === 'Parda') {
        if (g3 == null) return null;
        if (g3 === 'Parda') return equipoMano;
        return g3;
      }
    }
    return null;
  }

  async cantarEnvido(tipo: string): Promise<void> {
    if (!this.mano) return;
    this.mostrarDialogo('J1', '¡' + tipo + '!');
    await this.call('cantar-envido', { manoId: this.mano.id, tipo });
  }

  async responderConsultaEnvido(aceptar: boolean): Promise<void> {
    if (!this.mano) return;
    if (aceptar) {
      this.mostrarDialogo('J1', '¡Dale!');
      this.mostrarDialogo('J3', '¡Envido!');
    } else {
      this.mostrarDialogo('J1', 'No, jugá');
    }
    await this.call('responder-consulta-envido', { manoId: this.mano.id, aceptar });
  }

  async responderConsultaTruco(voy: boolean): Promise<void> {
    if (!this.mano) return;
    if (voy) {
      // "Voy/Vení": el compañero juega una carta baja para que vos metas la alta.
      this.mostrarDialogo('J1', '¡Vení!');
      this.mostrarDialogo('J3', 'Va la baja');
    } else {
      // "Pongo": el compañero juega su carta más alta.
      this.mostrarDialogo('J1', '¡Poné la alta!');
    }
    await this.call('responder-consulta-truco', { manoId: this.mano.id, voy });
  }

  async responderEnvido(aceptar: boolean, escalarA?: string): Promise<void> {
    if (!this.mano) return;
    this.mostrarDialogo('J1', escalarA ? '¡' + escalarA + '!' : (aceptar ? '¡Quiero!' : '¡No quiero!'));
    await this.call('responder-envido', { manoId: this.mano.id, aceptar, escalarA });
  }

  async declararTanto(): Promise<void> {
    if (!this.mano) return;
    this.mostrarDialogo('J1', String(this.tantoInput));
    await this.call('declarar-tanto', { manoId: this.mano.id, tanto: this.tantoInput });
    this.mostrarInputTanto = false;
  }

  async sonBuenas(): Promise<void> {
    if (!this.mano) return;
    this.mostrarDialogo('J1', '¡Son buenas!');
    await this.call('son-buenas', { manoId: this.mano.id });
    this.mostrarInputTanto = false;
  }

  async cantarTruco(): Promise<void> {
    if (!this.mano) return;
    this.mostrarDialogo('J1', '¡Truco!');
    await this.call('cantar-truco', { manoId: this.mano.id });
  }

  async responderTruco(aceptar: boolean, escalarA?: string): Promise<void> {
    if (!this.mano) return;
    const txt = escalarA
      ? '¡' + (escalarA === 'retruco' ? 'Retruco' : 'Vale cuatro') + '!'
      : (aceptar ? '¡Quiero!' : '¡No quiero!');
    this.mostrarDialogo('J1', txt);
    await this.call('responder-truco', { manoId: this.mano.id, aceptar, escalarA });
  }

  async escalarTruco(): Promise<void> {
    if (!this.mano) return;
    const nombre = this.mano.nivelTruco === 1 ? 'Retruco' : 'Vale cuatro';
    this.mostrarDialogo('J1', '¡' + nombre + '!');
    await this.call('escalar-truco', { manoId: this.mano.id });
  }

  async irseAlMazo(): Promise<void> {
    if (!this.mano) return;
    await this.call('irse-al-mazo', { manoId: this.mano.id });
  }

  async nuevaMano(): Promise<void> {
    if (!this.mano) return;
    this.cancelarCountdown();
    await this.call('nueva-mano', { manoId: this.mano.id });
    this.gameOver = false;
  }

  async nuevaPartida(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.post<ManoTruco2v2>(`${API}/nueva-partida`, {})
      );
      this.actualizarEstado(res);
      await this.correrMaquinas();
    } catch (e: any) {
      this.showToast('Error al iniciar partida: ' + (e?.error?.title ?? e?.message));
    }
  }

  // ── Llamada genérica al backend ───────────────────────────────
  private async call(endpoint: string, body: object): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.post<ManoTruco2v2>(`${API}/${endpoint}`, body)
      );
      this.actualizarEstado(res);
      await this.correrMaquinas();
    } catch (e: any) {
      this.showToast(e?.error?.detail ?? e?.error?.title ?? 'Error de conexión con el servidor.');
    }
  }

  // ── Avance de máquinas paso a paso, con delay y diálogos ──────
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /** Delay (ms) que tarda la máquina en jugar/cantar, configurable desde Configuración. */
  private get delayMaquinaMs(): number {
    const raw = localStorage.getItem('cfg_delay');
    if (raw == null) return 1200; // default si nunca se configuró
    const v = Number(raw);
    return Number.isFinite(v) && v >= 0 ? v : 1200;
  }

  private esperaAccionHumano(m: ManoTruco2v2): boolean {
    if (m.compaConsultaEnvido) return true;
    if (m.compaConsultaTruco) return true;
    // El envido va primero: si hay envido pendiente, decide su responsable (no el truco).
    if ((m.faseEnvido === 'pendiente_respuesta' || m.faseEnvido === 'declarando_tantos')
        && m.envidoPendienteRespuestaDe != null)
      return m.envidoPendienteRespuestaDe === 'J1';
    if (m.trucoPendienteRespuestaDe != null)
      return m.trucoPendienteRespuestaDe === 'J1';
    return m.turnoActual === 'J1';
  }

  private firmaEstado(m: ManoTruco2v2): string {
    const cartas = m.vueltas.reduce((a, v) => a + Object.keys(v.cartasJugadas).length, 0)
      + (m.vueltaActual ? Object.keys(m.vueltaActual.cartasJugadas).length : 0);
    return [m.turnoActual, cartas, m.faseEnvido, m.trucoPendienteRespuestaDe,
            m.envidoPendienteRespuestaDe, m.nivelTruco, m.manoTerminada].join('|');
  }

  private async correrMaquinas(): Promise<void> {
    if (this.maquinasCorriendo) return;
    this.maquinasCorriendo = true;
    try {
      let sinProgreso = 0;
      while (this.mano) {
        const m = this.mano;
        if (m.partidaTerminada || m.manoTerminada || m.ganadorMano) break;
        if (this.esperaAccionHumano(m)) break;

        const firmaAntes = this.firmaEstado(m);

        // Delay "pensando" antes de cada jugada de la máquina (configurable)
        await this.delay(this.delayMaquinaMs);

        let res: PasoResponse;
        try {
          res = await firstValueFrom(
            this.http.post<PasoResponse>(`${API}/avanzar-maquina`, { manoId: m.id })
          );
        } catch {
          this.showToast('Error de conexión con el servidor.');
          break;
        }

        if (res.evento && res.evento.texto) {
          this.mostrarDialogo(res.evento.jugador, res.evento.texto);
        }
        this.actualizarEstado(res.mano);
        if (!res.evento) break;

        // Guardia anti-cuelgue: si el estado no cambió, no insistir en loop infinito.
        if (this.firmaEstado(res.mano) === firmaAntes) {
          if (++sinProgreso >= 2) break;
        } else {
          sinProgreso = 0;
        }
      }
    } finally {
      this.maquinasCorriendo = false;
    }
  }

  private mostrarDialogo(jugador: string, texto: string, duracionMs = 2400): void {
    if (!texto) return;
    this.dialogos[jugador] = { texto };
    this.cdr.markForCheck();
    const prev = this.dialogoTimers[jugador];
    if (prev) clearTimeout(prev);
    this.dialogoTimers[jugador] = setTimeout(() => {
      this.dialogos[jugador] = null;
      this.cdr.markForCheck();
    }, duracionMs);
  }

  // ── Actualizar todo el estado de UI ──────────────────────────
  private actualizarEstado(mano: ManoTruco2v2): void {
    this.mano = mano;
    // Pista de envido del compañero ("Tengo poco/algo/mucho") — se muestra una vez.
    if (mano.compaPista && this.ultimaPista !== mano.compaPista) {
      this.ultimaPista = mano.compaPista;
      this.mostrarDialogo('J3', mano.compaPista);
    } else if (!mano.compaPista) {
      this.ultimaPista = null;
    }
    this.mesa = this.buildMesa(mano);
    this.tantoInput = this.calcularMiTanto(mano);
    this.mostrarInputTanto = mano.faseEnvido === 'declarando_tantos'
      && mano.envidoPendienteRespuestaDe === 'J1';
    this.buildBtns(mano);
    this.redrawTally(mano.puntosEquipoA, mano.puntosEquipoB);

    if (mano.partidaTerminada && !this.gameOver) {
      this.gameOver       = true;
      this.gameOverGanamos = mano.ganadorPartida === 'EquipoA';
    }

    // Nueva mano automática: al terminar la mano (y si la partida sigue), arranca la
    // cuenta regresiva de 3 s; también queda el botón "NUEVA MANO" para no esperar.
    if (mano.ganadorMano && !mano.partidaTerminada) {
      if (mano.ganadorMano !== this.prevGanadorMano) {
        this.iniciarCountdown(() => {
          if (this.mano?.ganadorMano && !this.mano?.partidaTerminada) this.nuevaMano();
        });
      }
    } else {
      this.cancelarCountdown();
    }
    this.prevGanadorMano = mano.ganadorMano ?? null;

    // "¿Y el truco entonces?": si en la primera vuelta el envido fue "va primero" y ya
    // se resolvió, pero todavía debés responder el truco, el rival re-pregunta.
    if (mano.trucoPendienteRespuestaDe === 'J1' && mano.envidoResuelto && mano.vueltas.length === 0) {
      const key = `${mano.numeroDeMano}-${mano.cantorTruco}`;
      if (this.trucoReanudadoKey !== key) {
        this.trucoReanudadoKey = key;
        this.mostrarDialogo(mano.cantorTruco ?? 'J2', '¿Y el truco entonces?');
      }
    }

    // Si la mano ya está ganada y solo falta tu carta (no cambia nada), se juega sola.
    this.intentarAutoJugarSiManoGanada(mano);

    this.cdr.markForCheck();
  }

  private buildMesa(mano: ManoTruco2v2): MesaJugadas {
    const mesa: MesaJugadas = { yo: [], compa: [], izq: [], der: [] };
    const vueltas: Vuelta2v2[] = [...mano.vueltas];
    if (mano.vueltaActual) vueltas.push(mano.vueltaActual);
    for (const v of vueltas) {
      if (v.cartasJugadas['J1']) mesa.yo.push(v.cartasJugadas['J1']);
      if (v.cartasJugadas['J3']) mesa.compa.push(v.cartasJugadas['J3']);
      if (v.cartasJugadas['J4']) mesa.izq.push(v.cartasJugadas['J4']);
      if (v.cartasJugadas['J2']) mesa.der.push(v.cartasJugadas['J2']);
    }
    return mesa;
  }

  private buildBtns(mano: ManoTruco2v2): void {
    const btns: BtnAccion[] = [];
    const esMiTurno  = mano.turnoActual === 'J1';
    const manoEnd    = mano.manoTerminada || !!mano.ganadorMano || mano.partidaTerminada;
    const envidoDisponible = !mano.envidoCantado && !mano.envidoResuelto && mano.vueltas.length === 0
      && (mano.posicion1?.jugadas?.length ?? 0) === 0  // el envido se canta ANTES de jugar tu carta
      && (
        !mano.trucoCantado
        // "Envido va primero": solo contra el PRIMER truco cantado por el rival (nivel 1),
        // todavía sin aceptar. Si el truco ya fue aceptado/escalado, la ventana se cerró.
        || (mano.trucoPendienteRespuestaDe === 'J1'
            && mano.nivelTruco === 1
            && mano.equipoCantorTruco === 'EquipoB')
      );
    const envidoEnResolucion = (mano.faseEnvido === 'pendiente_respuesta' || mano.faseEnvido === 'declarando_tantos')
      && mano.envidoPendienteRespuestaDe != null;

    // ── Tu compañero te pregunta si cantar los tantos ─────────
    if (mano.compaConsultaEnvido) {
      btns.push({ label: 'SÍ, CANTÁ', color: '#44ff44', enabled: true, action: () => this.responderConsultaEnvido(true) });
      btns.push({ label: 'NO, JUGÁ',  color: '#ff4444', enabled: true, action: () => this.responderConsultaEnvido(false) });
    }
    // ── Tu compañero te pregunta: ¿voy o pongo? (truco) ───────
    else if (mano.compaConsultaTruco) {
      btns.push({ label: 'VOY',   color: '#dd4422', enabled: true, action: () => this.responderConsultaTruco(true) });
      btns.push({ label: 'PONGO', color: '#4488ff', enabled: true, action: () => this.responderConsultaTruco(false) });
    }
    // ── Responder envido (va primero) ─────────────────────────
    else if (mano.envidoPendienteRespuestaDe === 'J1' && mano.faseEnvido === 'pendiente_respuesta') {
      btns.push({ label: 'QUIERO',       color: '#44ff44', enabled: true, action: () => this.responderEnvido(true) });
      const tipo = mano.tipoEnvidoCantado ?? 'Envido';
      if (tipo === 'Envido')
        btns.push({ label: 'ENVIDO',       color: '#4488ff', enabled: true, action: () => this.responderEnvido(true, 'Envido Envido') });
      if (tipo === 'Envido' || tipo === 'EnvidoEnvido')
        btns.push({ label: 'REAL ENVIDO',  color: '#4488ff', enabled: true, action: () => this.responderEnvido(true, 'Real Envido') });
      if (tipo !== 'FaltaEnvido')
        btns.push({ label: 'FALTA ENVIDO', color: '#4488ff', enabled: true, action: () => this.responderEnvido(true, 'Falta Envido') });
      btns.push({ label: 'NO QUIERO',    color: '#ff4444', enabled: true, action: () => this.responderEnvido(false) });
    }
    // ── Declarar tanto (va primero) ───────────────────────────
    else if (mano.envidoPendienteRespuestaDe === 'J1' && mano.faseEnvido === 'declarando_tantos') {
      btns.push({ label: `TENGO ${this.tantoInput}`, color: '#44ff44', enabled: true, action: () => this.declararTanto() });
      // "Son buenas" solo tiene sentido si un rival YA cantó un tanto que no podés superar.
      // Si sos el primero en cantar (el mano), no aparece.
      const rivalDeclaro = (mano.tantosDeclarados?.['J2'] ?? null) !== null
                        || (mano.tantosDeclarados?.['J4'] ?? null) !== null;
      if (rivalDeclaro) {
        btns.push({ label: 'SON BUENAS', color: '#ffaa00', enabled: true, action: () => this.sonBuenas() });
      }
    }
    // ── Esperando que los rivales/compañero resuelvan el envido ─
    else if (envidoEnResolucion) {
      // sin botones
    }
    // ── Responder truco ───────────────────────────────────────
    else if (mano.trucoPendienteRespuestaDe === 'J1') {
      btns.push({ label: 'QUIERO',    color: '#44ff44', enabled: true, action: () => this.responderTruco(true)  });
      if ((mano.nivelTruco ?? 0) < 3 && mano.puedeEscalarTruco === 'J1') {
        const lbl = mano.nivelTruco === 1 ? 'RETRUCO' : 'VALE 4';
        const esc = mano.nivelTruco === 1 ? 'retruco' : 'valecuatro';
        btns.push({ label: lbl, color: '#ffaa00', enabled: true, action: () => this.responderTruco(true, esc) });
      }
      btns.push({ label: 'NO QUIERO', color: '#ff4444', enabled: true, action: () => this.responderTruco(false) });
      if (envidoDisponible) {
        btns.push({ label: 'Envido',       color: '#4488ff', enabled: true, action: () => this.cantarEnvido('Envido') });
        btns.push({ label: 'Real Envido',  color: '#4488ff', enabled: true, action: () => this.cantarEnvido('Real Envido') });
        btns.push({ label: 'Falta Envido', color: '#4488ff', enabled: true, action: () => this.cantarEnvido('Falta Envido') });
      }
    }
    // ── Mano terminada ────────────────────────────────────────
    else if (mano.manoTerminada && !mano.partidaTerminada) {
      btns.push({ label: 'NUEVA MANO', color: '#cc8800', enabled: true, action: () => this.nuevaMano() });
    }
    // ── Turno normal ──────────────────────────────────────────
    else if (!manoEnd) {
      if (envidoDisponible) {
        btns.push({ label: 'Envido',       color: '#4488ff', enabled: esMiTurno, action: () => this.cantarEnvido('Envido') });
        btns.push({ label: 'Real Envido',  color: '#4488ff', enabled: esMiTurno, action: () => this.cantarEnvido('Real Envido') });
        btns.push({ label: 'Falta Envido', color: '#4488ff', enabled: esMiTurno, action: () => this.cantarEnvido('Falta Envido') });
      }
      if (!mano.trucoCantado) {
        btns.push({ label: 'Truco', color: '#dd4422', enabled: esMiTurno, action: () => this.cantarTruco() });
      } else if (
        mano.trucoPendienteRespuestaDe == null &&
        (mano.nivelTruco ?? 0) >= 1 && (mano.nivelTruco ?? 0) < 3 &&
        mano.equipoCantorTruco !== 'EquipoA'
      ) {
        // Aceptaste el truco → tu equipo tiene la palabra y puede subir la apuesta.
        const lbl = mano.nivelTruco === 1 ? 'Retruco' : 'Vale 4';
        btns.push({ label: lbl, color: '#ffaa00', enabled: esMiTurno, action: () => this.escalarTruco() });
      }
      btns.push({ label: 'Ir al mazo', color: '#884422', enabled: esMiTurno, action: () => this.irseAlMazo() });
    }

    this.btns = btns;
  }

  private calcularTurnoBadge(): string {
    const m = this.mano;
    if (!m) return '';
    if (m.partidaTerminada) return '';
    if (m.compaConsultaEnvido) return 'Tu compañero pregunta: ¿canto los tantos?';
    if (m.compaConsultaTruco) return 'Tu compañero pregunta: ¿voy o pongo?';
    if (m.manoTerminada) {
      const gan = m.ganadorMano === 'EquipoA' ? '¡Ganaron la mano!' : 'Perdieron la mano.';
      return this.countdown != null ? `${gan} Nueva mano en ${this.countdown}...` : gan;
    }
    if (m.trucoPendienteRespuestaDe === 'J1') return 'Respondé el Truco';
    if (m.envidoPendienteRespuestaDe === 'J1' && m.faseEnvido === 'pendiente_respuesta') return 'Respondé el Envido';
    if (m.envidoPendienteRespuestaDe === 'J1' && m.faseEnvido === 'declarando_tantos') return 'Declarás tus tantos';
    if (m.turnoActual === 'J1') return 'Tu turno — jugá una carta o cantá';
    return `Turno de ${m.turnoActual === 'J3' ? 'tu compañero' : 'un rival'}...`;
  }

  private calcularMiTanto(mano: ManoTruco2v2): number {
    // El envido se calcula con las 3 cartas originales (mano + las ya jugadas).
    const j = mano.posicion1;
    const cartas: Carta2v2[] = [...(j?.mano ?? []), ...(j?.jugadas ?? [])];
    return this.calcularTanto(cartas);
  }

  private calcularTanto(cartas: Carta2v2[]): number {
    const grupos: Record<string, number[]> = {};
    for (const c of cartas) {
      const v = c.numero >= 10 ? 0 : c.numero;
      if (!grupos[c.palo]) grupos[c.palo] = [];
      grupos[c.palo].push(v);
    }
    let mejor = 0;
    for (const vals of Object.values(grupos)) {
      const sorted = [...vals].sort((a, b) => b - a);
      if (sorted.length >= 2) mejor = Math.max(mejor, sorted[0] + sorted[1] + 20);
    }
    if (mejor > 0) return mejor;
    return Math.max(...cartas.map(c => c.numero >= 10 ? 0 : c.numero), 0);
  }

  // ── Tanteador ─────────────────────────────────────────────────
  private redrawTally(ptsA: number, ptsB: number): void {
    this.tallySticksNosotros = this.buildTally(ptsA, '#c8a030');
    this.tallySticksEllos    = this.buildTally(ptsB, '#d46010');
  }

  private buildTally(pts: number, color: string): any[] {
    const out: any[] = [];
    const capped = Math.min(pts, 30); // la partida es a 30
    if (capped <= 0) return out;
    // Mitad izquierda (las "malas"): puntos 1–15. Mitad derecha (las "buenas"): 16–30.
    this.buildTallyMitad(out, Math.min(capped, 15), color, 6);
    if (capped > 15) this.buildTallyMitad(out, capped - 15, color, 71);
    return out;
  }

  private buildTallyMitad(out: any[], pts: number, color: string, startX: number): void {
    if (pts <= 0) return;
    const full = Math.floor(pts / 5), rem = pts % 5;
    const BS = 14, BGAP = 3, SL = 9, SGAP = 3, y = 19; // centrado vertical en el viewBox (alto 52)
    let bx = startX;
    for (let i = 0; i < Math.min(full, 3); i++) {
      this.addBox(out, bx, y, BS, color);
      bx += BS + BGAP;
    }
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
  salirPartida():    void { this.mostrarConfirmSalir = true; }
  cancelarSalir():   void { this.mostrarConfirmSalir = false; }
  async confirmarSalir(): Promise<void> {
    this.mostrarConfirmSalir = false;
    const esPulperia = localStorage.getItem('origenPulperia') === '1';
    localStorage.removeItem('origenPulperia');
    if (esPulperia) {
      // Lanzado como overlay desde la pulpería: notificar a Historia para cerrar
      window.dispatchEvent(new CustomEvent('truco-2v2:end'));
    } else {
      this.router.navigate(['/home']);
    }
  }

  // ── Acciones del humano hacia su compañero ────────────────────
  abrirAcciones():  void { this.mostrarAcciones = true;  this.cdr.markForCheck(); }
  cerrarAcciones(): void { this.mostrarAcciones = false; this.cdr.markForCheck(); }

  private jugadorDe(jugadorId: string): Jugador2v2 | null {
    const m = this.mano; if (!m) return null;
    switch (jugadorId) {
      case 'J1': return m.posicion1; case 'J2': return m.posicion2;
      case 'J3': return m.posicion3; case 'J4': return m.posicion4;
      default: return null;
    }
  }

  /** El jugador solo puede ordenar cuando no terminó la mano y el compañero tiene cartas. */
  puedeOrdenarJugar(jugadorId: string): boolean {
    if (!this.mano || this.mano.manoTerminada || this.mano.partidaTerminada) return false;
    const j = this.jugadorDe(jugadorId);
    return (j?.mano?.length ?? 0) > 0;
  }

  async ordenarJugarMayor(jugadorId: string): Promise<void> {
    this.cerrarAcciones();
    if (!this.mano) return;
    const frases = [
      '¡Pongo la más alta!',
      '¡Voy con todo!',
      '¡La mejor que tengo!',
      '¡Ahí va la mía!',
      '¡Tomo el mando!',
    ];
    const txt = frases[Math.floor(Math.random() * frases.length)];
    this.mostrarDialogo(jugadorId, txt);
    // Registrar la orden en el backend; la máquina la ejecutará en su próximo turno.
    try {
      const res = await firstValueFrom(
        this.http.post<ManoTruco2v2>(`${API}/ordenar-mayor`, { manoId: this.mano.id, jugadorId })
      );
      this.actualizarEstado(res);
      await this.correrMaquinas();
    } catch (e: any) {
      this.showToast(e?.error?.detail ?? e?.error?.title ?? 'Error al enviar la orden.');
    }
  }

  consultarMano(jugadorId: string): void {
    this.cerrarAcciones();
    const jugador = this.jugadorDe(jugadorId);
    if (!jugador) return;

    const cartas = jugador.mano; // solo las que tiene en mano (no jugadas)
    if (cartas.length === 0) {
      this.mostrarDialogo(jugadorId, '¡Sin cartas ya!');
      return;
    }

    // valorTruco: 13=1esp, 12=1basto, 11=7esp, 10=7oro, 9=3s, 8=2s, 7=1copa/oro…
    const excelentes = cartas.filter(c => c.valorTruco >= 11).length; // anchos o 7esp
    const buenas     = cartas.filter(c => c.valorTruco >= 8 && c.valorTruco < 11).length; // 2s, 3s, 7oro
    const medias     = cartas.filter(c => c.valorTruco >= 4 && c.valorTruco < 8).length;

    let respuesta: string;
    if (excelentes >= 2)                        respuesta = '¡Tengo dos anchos!';
    else if (excelentes === 1 && buenas >= 1)   respuesta = '¡Ancho y algo más!';
    else if (excelentes === 1)                  respuesta = 'Tengo un ancho';
    else if (buenas >= 2)                       respuesta = '¡Dos buenas!';
    else if (buenas === 1 && medias >= 1)       respuesta = 'Una buena y del medio';
    else if (buenas === 1)                      respuesta = 'Tengo una buena';
    else if (medias >= 2)                       respuesta = 'Dos del medio...';
    else if (medias === 1)                      respuesta = 'Una del medio, nada más';
    else                                        respuesta = 'Poco y nada...';

    this.mostrarDialogo(jugadorId, respuesta, 3600);
  }

  private showToast(msg: string, tipo: 'error' | 'info' = 'error'): void {
    this.toastMsg  = msg;
    this.toastTipo = tipo;
    this.cdr.markForCheck();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastMsg = ''; this.cdr.markForCheck(); }, tipo === 'info' ? 2600 : 4000);
  }
}
