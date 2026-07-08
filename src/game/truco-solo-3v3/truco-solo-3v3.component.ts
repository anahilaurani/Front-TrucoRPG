import {
  Component, OnInit, OnDestroy,
  ChangeDetectorRef, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

// ── Tipos del backend ─────────────────────────────────────────────
export interface Carta3v3 { numero: number; palo: string; valorTruco: number; }

interface Jugador3v3 {
  id: string; nombre: string; esMaquina: boolean;
  mano: Carta3v3[]; jugadas: Carta3v3[];
}

interface Vuelta3v3 {
  cartasJugadas: Record<string, Carta3v3>;
  ganadorVuelta: string | null;
}

export interface ManoTruco3v3 {
  id: string;
  numeroDeMano: number;
  posicion1: Jugador3v3; posicion2: Jugador3v3; posicion3: Jugador3v3;
  posicion4: Jugador3v3; posicion5: Jugador3v3; posicion6: Jugador3v3;

  turnoActual: string;
  jugadorMano: string;
  equipoMano: string;

  vueltas: Vuelta3v3[];
  vueltaActual: Vuelta3v3 | null;
  ganadorMano: string | null;
  manoTerminada: boolean;

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

  trucoCantado: boolean;
  trucoResuelto: boolean;
  cantorTruco: string | null;
  equipoCantorTruco: string | null;
  nivelTruco: number;
  puntosTrucoMano: number;
  estadoTruco: string | null;
  trucoPendienteRespuestaDe: string | null;
  puedeEscalarTruco: string | null;

  puntosEquipoA: number;
  puntosEquipoB: number;
  partidaTerminada: boolean;
  ganadorPartida: string | null;

  // Pica-Pica (1 vs 1)
  picaPica: boolean;

  // Consulta de compañeros bot
  compaConsultaEnvido: boolean;
  compaConsultaTruco: boolean;
  compaPista: string | null;
  compaConsultor: string | null;
  // Orden del humano: este bot debe jugar su carta más alta en su próximo turno
  ordenJugarMayor: string | null;
}

interface MesaJugadas { yo: Carta3v3[]; der: Carta3v3[][]; izq: Carta3v3[][]; frente: Carta3v3[]; }
interface BtnAccion { label: string; color: string; action: () => void; enabled: boolean; }
interface EventoMaquina { jugador: string; tipo: string; texto: string; }
interface PasoResponse  { mano: ManoTruco3v3; evento: EventoMaquina | null; }

const API = '/api/truco3v3';

@Component({
  selector: 'app-truco-solo-3v3',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './truco-solo-3v3.component.html',
  styleUrls: [
    '../truco-solo/truco-solo.component.css',
    '../truco-2v2/truco-2v2.component.css',
    '../truco-3v3/truco-3v3.component.css',
    './truco-solo-3v3.component.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrucoSolo3v3Component implements OnInit, OnDestroy {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private cdr    = inject(ChangeDetectorRef);

  // El humano siempre es J1 (EquipoA).
  readonly miRol = 'J1';
  readonly miEquipo = 'EquipoA';

  mano: ManoTruco3v3 | null = null;

  btns: BtnAccion[] = [];
  mesa: MesaJugadas = { yo: [], der: [[], []], izq: [[], []], frente: [] };
  mostrarConfirmSalir = false;
  mostrarAcciones = false;
  toastMsg = '';
  toastTipo: 'error' | 'info' = 'error';
  gameOver = false;
  gameOverGanamos = false;

  readonly companerosAcciones = [
    { id: 'J3', nombre: 'J3 · Compañero 1' },
    { id: 'J5', nombre: 'J5 · Compañero 2' },
  ];

  modoPicaPica = false; // se activa cuando un equipo llega a 5; ciclos de 3 duelos hasta que alguno llega a 25, luego solo redondas hasta 30

  countdown: number | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private prevGanadorMano: string | null = null;

  readonly fanAngles = [-14, 0, 14];
  readonly fanXOff   = [-22, 0, 22];

  dialogos: Record<string, { texto: string } | null> = {
    J1: null, J2: null, J3: null, J4: null, J5: null, J6: null,
  };
  private dialogoTimers: Record<string, ReturnType<typeof setTimeout> | null> = {
    J1: null, J2: null, J3: null, J4: null, J5: null, J6: null,
  };
  private maquinasCorriendo = false;
  private ultimaPista: string | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Asientos relativos a J1 ───────────────────────────────────
  private rolAsiento(offset: number): string {
    const p = 1; // humano = J1
    return 'J' + (((p - 1 + offset) % 6) + 1);
  }
  get rolFrente(): string { return this.rolAsiento(3); }
  get rolDer():   string[] { return [this.rolAsiento(2), this.rolAsiento(1)]; }
  get rolIzq():   string[] { return [this.rolAsiento(4), this.rolAsiento(5)]; }

  jugadorDe(rol: string): Jugador3v3 | null {
    const m = this.mano; if (!m) return null;
    switch (rol) {
      case 'J1': return m.posicion1; case 'J2': return m.posicion2; case 'J3': return m.posicion3;
      case 'J4': return m.posicion4; case 'J5': return m.posicion5; case 'J6': return m.posicion6;
      default: return null;
    }
  }
  get yo(): Jugador3v3 | null { return this.mano?.posicion1 ?? null; }
  esMano(rol: string): boolean { return this.mano?.jugadorMano === rol; }
  mismoEquipo(rol: string): boolean {
    return Number(rol.replace('J', '')) % 2 === 1; // impares = EquipoA (el del humano)
  }

  get puntosNosotros(): number { return this.mano?.puntosEquipoA ?? 0; }
  get puntosEllos():    number { return this.mano?.puntosEquipoB ?? 0; }
  get estadoEnvido():   string { return this.mano?.estadoEnvido ?? 'No se cantó.'; }
  get estadoTruco():    string { return this.mano?.estadoTruco  ?? 'No se cantó.'; }
  get turnoBadge():     string { return this.calcularTurnoBadge(); }

  tallySticksNosotros: any[] = [];
  tallySticksEllos:    any[] = [];

  async ngOnInit(): Promise<void> { await this.nuevaPartida(); }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.cancelarCountdown();
    for (const k of Object.keys(this.dialogoTimers)) {
      const t = this.dialogoTimers[k]; if (t) clearTimeout(t);
    }
  }

  // ── Acciones del humano ───────────────────────────────────────
  async jugarCarta(carta: Carta3v3): Promise<void> {
    if (!this.mano) return;
    if (this.mano.manoTerminada || this.mano.ganadorMano || this.mano.partidaTerminada) return;
    if (this.mano.trucoPendienteRespuestaDe === 'J1' ||
        (this.mano.envidoPendienteRespuestaDe === 'J1' &&
         (this.mano.faseEnvido === 'pendiente_respuesta' || this.mano.faseEnvido === 'declarando_tantos'))) {
      this.showToast('No podés jugar: primero respondé el canto.', 'info');
      return;
    }
    if (this.mano.turnoActual !== 'J1') { this.showToast('Esperá tu turno para jugar.', 'info'); return; }
    await this.call('jugar-carta', { manoId: this.mano.id, numero: carta.numero, palo: carta.palo });
  }

  async cantarEnvido(tipo: string): Promise<void> {
    if (!this.mano) return;
    this.mostrarDialogo('J1', '¡' + tipo + '!');
    await this.call('cantar-envido', { manoId: this.mano.id, tipo });
  }
  async responderEnvido(aceptar: boolean, escalarA?: string): Promise<void> {
    if (!this.mano) return;
    this.mostrarDialogo('J1', escalarA ? '¡' + escalarA + '!' : (aceptar ? '¡Quiero!' : '¡No quiero!'));
    await this.call('responder-envido', { manoId: this.mano.id, aceptar, escalarA });
  }
  async declararTanto(tanto: number): Promise<void> {
    if (!this.mano) return;
    this.mostrarDialogo('J1', String(tanto));
    await this.call('declarar-tanto', { manoId: this.mano.id, tanto });
  }
  async sonBuenas(): Promise<void> {
    if (!this.mano) return;
    this.mostrarDialogo('J1', '¡Son buenas!');
    await this.call('son-buenas', { manoId: this.mano.id });
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

  // ── Respuestas a las consultas del compañero ──────────────────
  async responderConsultaEnvido(aceptar: boolean): Promise<void> {
    if (!this.mano) return;
    const consultor = this.mano.compaConsultor ?? 'J3';
    this.mostrarDialogo('J1', aceptar ? '¡Dale!' : 'No, jugá');
    if (aceptar) this.mostrarDialogo(consultor, '¡Envido!');
    await this.call('responder-consulta-envido', { manoId: this.mano.id, aceptar });
  }

  async responderConsultaTruco(voy: boolean): Promise<void> {
    if (!this.mano) return;
    const consultor = this.mano.compaConsultor ?? 'J3';
    this.mostrarDialogo('J1', voy ? '¡Vení!' : '¡Poné la alta!');
    this.mostrarDialogo(consultor, voy ? 'Va la baja' : '¡La alta!');
    await this.call('responder-consulta-truco', { manoId: this.mano.id, voy });
  }
  async nuevaMano(): Promise<void> {
    if (!this.mano) return;
    this.cancelarCountdown();
    await this.call('nueva-mano', { manoId: this.mano.id });
    this.gameOver = false;
  }

  async nuevaPartida(): Promise<void> {
    try {
      const res = await firstValueFrom(this.http.post<ManoTruco3v3>(`${API}/nueva-partida`, {}));
      this.actualizarEstado(res);
      await this.correrMaquinas();
    } catch (e: any) {
      this.showToast('Error al iniciar partida: ' + (e?.error?.title ?? e?.message));
    }
  }

  private async call(endpoint: string, body: object): Promise<void> {
    try {
      const res = await firstValueFrom(this.http.post<ManoTruco3v3>(`${API}/${endpoint}`, body));
      this.actualizarEstado(res);
      await this.correrMaquinas();
    } catch (e: any) {
      this.showToast(e?.error?.detail ?? e?.error?.title ?? 'Error de conexión con el servidor.');
    }
  }

  // ── Avance de máquinas paso a paso ────────────────────────────
  private delay(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
  private get delayMaquinaMs(): number {
    const raw = localStorage.getItem('cfg_delay');
    if (raw == null) return 1100;
    const v = Number(raw);
    return Number.isFinite(v) && v >= 0 ? v : 1100;
  }

  private esperaAccionHumano(m: ManoTruco3v3): boolean {
    // Un compañero te está preguntando algo → decidís vos.
    if (m.compaConsultaEnvido || m.compaConsultaTruco) return true;
    if ((m.faseEnvido === 'pendiente_respuesta' || m.faseEnvido === 'declarando_tantos')
        && m.envidoPendienteRespuestaDe != null)
      return m.envidoPendienteRespuestaDe === 'J1';
    if (m.trucoPendienteRespuestaDe != null) return m.trucoPendienteRespuestaDe === 'J1';
    return m.turnoActual === 'J1';
  }

  private firmaEstado(m: ManoTruco3v3): string {
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
        await this.delay(this.delayMaquinaMs);

        let res: PasoResponse;
        try {
          res = await firstValueFrom(this.http.post<PasoResponse>(`${API}/avanzar-maquina`, { manoId: m.id }));
        } catch {
          this.showToast('Error de conexión con el servidor.');
          break;
        }

        if (res.evento && res.evento.texto) this.mostrarDialogo(res.evento.jugador, res.evento.texto);
        this.actualizarEstado(res.mano);
        if (!res.evento) break;

        if (this.firmaEstado(res.mano) === firmaAntes) { if (++sinProgreso >= 2) break; }
        else sinProgreso = 0;
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
    this.dialogoTimers[jugador] = setTimeout(() => { this.dialogos[jugador] = null; this.cdr.markForCheck(); }, duracionMs);
  }

  private seatDeRol(rol: string): string | null {
    if (rol === 'J1') return 'J1';
    if (rol === this.rolFrente) return rol;
    if (this.rolIzq.includes(rol)) return rol;
    if (this.rolDer.includes(rol)) return rol;
    return rol;
  }

  // ── Actualizar estado de UI ───────────────────────────────────
  private actualizarEstado(mano: ManoTruco3v3): void {
    this.mano = mano;
    this.modoPicaPica = mano.picaPica;
    this.mesa = this.buildMesa(mano);
    this.buildBtns(mano);
    this.redrawTally(mano.puntosEquipoA, mano.puntosEquipoB);

    // Pista del compañero ("Tengo mucho/algo/poco") → burbuja sobre su asiento.
    if (mano.compaPista && mano.compaConsultor && this.ultimaPista !== mano.compaPista + mano.compaConsultor) {
      this.ultimaPista = mano.compaPista + mano.compaConsultor;
      this.mostrarDialogo(mano.compaConsultor, mano.compaPista);
    } else if (!mano.compaPista) {
      this.ultimaPista = null;
    }

    if (mano.partidaTerminada && !this.gameOver) {
      this.gameOver = true;
      this.gameOverGanamos = mano.ganadorPartida === 'EquipoA';
    }

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

    this.cdr.markForCheck();
  }

  private cartasDeRol(mano: ManoTruco3v3, rol: string): Carta3v3[] {
    const out: Carta3v3[] = [];
    const vueltas = [...mano.vueltas];
    if (mano.vueltaActual) vueltas.push(mano.vueltaActual);
    for (const v of vueltas) if (v.cartasJugadas[rol]) out.push(v.cartasJugadas[rol]);
    return out;
  }

  private buildMesa(mano: ManoTruco3v3): MesaJugadas {
    return {
      yo:     this.cartasDeRol(mano, 'J1'),
      der:    this.rolDer.map(r => this.cartasDeRol(mano, r)),
      izq:    this.rolIzq.map(r => this.cartasDeRol(mano, r)),
      frente: this.cartasDeRol(mano, this.rolFrente),
    };
  }

  cartasEnMano(rol: string): number[] {
    const j = this.jugadorDe(rol);
    const n = j ? j.mano.length : 0;
    return Array.from({ length: n }, (_, i) => i);
  }

  private buildBtns(mano: ManoTruco3v3): void {
    const btns: BtnAccion[] = [];
    const esMiTurno = mano.turnoActual === 'J1';
    const manoEnd   = mano.manoTerminada || !!mano.ganadorMano || mano.partidaTerminada;
    const equipoRival = 'EquipoB';

    const yaJugue = (mano.posicion1?.jugadas?.length ?? 0) > 0;
    const envidoDisponible = !mano.envidoCantado && !mano.envidoResuelto && mano.vueltas.length === 0 && !yaJugue
      && (!mano.trucoCantado
          || (mano.trucoPendienteRespuestaDe === 'J1' && mano.nivelTruco === 1 && mano.equipoCantorTruco === equipoRival));

    // ── Tu compañero te pregunta: ¿canto los tantos? ──
    if (mano.compaConsultaEnvido) {
      btns.push({ label: 'SÍ, CANTÁ', color: '#44ff44', enabled: true, action: () => this.responderConsultaEnvido(true) });
      btns.push({ label: 'NO, JUGÁ',  color: '#ff4444', enabled: true, action: () => this.responderConsultaEnvido(false) });
      this.btns = btns;
      return;
    }
    // ── Tu compañero te pregunta: ¿voy o pongo? ──
    if (mano.compaConsultaTruco) {
      btns.push({ label: 'VOY',   color: '#dd4422', enabled: true, action: () => this.responderConsultaTruco(true) });
      btns.push({ label: 'PONGO', color: '#4488ff', enabled: true, action: () => this.responderConsultaTruco(false) });
      this.btns = btns;
      return;
    }

    if (mano.envidoPendienteRespuestaDe === 'J1' && mano.faseEnvido === 'pendiente_respuesta') {
      btns.push({ label: 'QUIERO', color: '#44ff44', enabled: true, action: () => this.responderEnvido(true) });
      const tipo = mano.tipoEnvidoCantado ?? 'Envido';
      if (tipo === 'Envido')
        btns.push({ label: 'ENVIDO', color: '#4488ff', enabled: true, action: () => this.responderEnvido(true, 'Envido Envido') });
      if (tipo === 'Envido' || tipo === 'EnvidoEnvido')
        btns.push({ label: 'REAL ENVIDO', color: '#4488ff', enabled: true, action: () => this.responderEnvido(true, 'Real Envido') });
      if (tipo !== 'FaltaEnvido')
        btns.push({ label: 'FALTA ENVIDO', color: '#4488ff', enabled: true, action: () => this.responderEnvido(true, 'Falta Envido') });
      btns.push({ label: 'NO QUIERO', color: '#ff4444', enabled: true, action: () => this.responderEnvido(false) });
    }
    else if (mano.envidoPendienteRespuestaDe === 'J1' && mano.faseEnvido === 'declarando_tantos') {
      const tanto = this.calcularMiTanto(mano);
      btns.push({ label: `TENGO ${tanto}`, color: '#44ff44', enabled: true, action: () => this.declararTanto(tanto) });
      const rivalDeclaro = Object.entries(mano.tantosDeclarados ?? {})
        .some(([rol, t]) => t != null && Number(rol.replace('J', '')) % 2 === 0);
      if (rivalDeclaro)
        btns.push({ label: 'SON BUENAS', color: '#ffaa00', enabled: true, action: () => this.sonBuenas() });
    }
    else if ((mano.faseEnvido === 'pendiente_respuesta' || mano.faseEnvido === 'declarando_tantos')
              && mano.envidoPendienteRespuestaDe != null) {
      // esperando a otros
    }
    else if (mano.trucoPendienteRespuestaDe === 'J1') {
      btns.push({ label: 'QUIERO', color: '#44ff44', enabled: true, action: () => this.responderTruco(true) });
      if ((mano.nivelTruco ?? 0) < 3 && mano.puedeEscalarTruco === 'J1') {
        const lbl = mano.nivelTruco === 1 ? 'RETRUCO' : 'VALE 4';
        const esc = mano.nivelTruco === 1 ? 'retruco' : 'valecuatro';
        btns.push({ label: lbl, color: '#ffaa00', enabled: true, action: () => this.responderTruco(true, esc) });
      }
      btns.push({ label: 'NO QUIERO', color: '#ff4444', enabled: true, action: () => this.responderTruco(false) });
      if (envidoDisponible) {
        btns.push({ label: 'Envido', color: '#4488ff', enabled: true, action: () => this.cantarEnvido('Envido') });
        btns.push({ label: 'Real Envido', color: '#4488ff', enabled: true, action: () => this.cantarEnvido('Real Envido') });
        btns.push({ label: 'Falta Envido', color: '#4488ff', enabled: true, action: () => this.cantarEnvido('Falta Envido') });
      }
    }
    else if (mano.manoTerminada && !mano.partidaTerminada) {
      btns.push({ label: 'NUEVA MANO', color: '#cc8800', enabled: true, action: () => this.nuevaMano() });
    }
    else if (!manoEnd) {
      if (envidoDisponible) {
        btns.push({ label: 'Envido', color: '#4488ff', enabled: esMiTurno, action: () => this.cantarEnvido('Envido') });
        btns.push({ label: 'Real Envido', color: '#4488ff', enabled: esMiTurno, action: () => this.cantarEnvido('Real Envido') });
        btns.push({ label: 'Falta Envido', color: '#4488ff', enabled: esMiTurno, action: () => this.cantarEnvido('Falta Envido') });
      }
      if (!mano.trucoCantado) {
        btns.push({ label: 'Truco', color: '#dd4422', enabled: esMiTurno, action: () => this.cantarTruco() });
      } else if (
        mano.trucoPendienteRespuestaDe == null &&
        (mano.nivelTruco ?? 0) >= 1 && (mano.nivelTruco ?? 0) < 3 &&
        mano.equipoCantorTruco !== 'EquipoA'
      ) {
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
    return `Turno de ${m.turnoActual}...`;
  }

  private calcularMiTanto(mano: ManoTruco3v3): number {
    const j = mano.posicion1;
    return this.calcularTanto([...(j?.mano ?? []), ...(j?.jugadas ?? [])]);
  }
  private calcularTanto(cartas: Carta3v3[]): number {
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

  // ── Cuenta regresiva ──────────────────────────────────────────
  private iniciarCountdown(onComplete: () => void): void {
    this.cancelarCountdown();
    this.countdown = 3;
    this.cdr.markForCheck();
    this.countdownInterval = setInterval(() => {
      this.countdown = (this.countdown ?? 1) - 1;
      this.cdr.markForCheck();
      if ((this.countdown ?? 0) <= 0) { this.cancelarCountdown(); onComplete(); }
    }, 1000);
  }
  private cancelarCountdown(): void {
    if (this.countdownInterval) { clearInterval(this.countdownInterval); this.countdownInterval = null; }
    this.countdown = null;
  }

  // ── Tanteador ─────────────────────────────────────────────────
  private redrawTally(ptsA: number, ptsB: number): void {
    this.tallySticksNosotros = this.buildTally(ptsA, '#c8a030');
    this.tallySticksEllos    = this.buildTally(ptsB, '#d46010');
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
    const BS = 17, BGAP = 4, SL = 12, SGAP = 4, y = 8;
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

  cardImg(c: Carta3v3): string {
    const nums: Record<number, number> = { 1:1,2:2,3:3,4:4,5:5,6:6,7:7,10:8,11:9,12:10 };
    const palos: Record<string, number> = { Oro:0, Copa:10, Espada:20, Basto:30 };
    return `assets/cards/${(palos[c.palo] ?? 0) + (nums[c.numero] ?? 1)}.PNG`;
  }

  salirPartida():    void { this.mostrarConfirmSalir = true; }
  cancelarSalir():   void { this.mostrarConfirmSalir = false; }
  confirmarSalir(): void {
    this.mostrarConfirmSalir = false;
    const esPulperia = localStorage.getItem('origenPulperia') === '1';
    localStorage.removeItem('origenPulperia');
    if (esPulperia) {
      window.dispatchEvent(new CustomEvent('truco-3v3:end'));
    } else {
      this.router.navigate(['/home']);
    }
  }

  // ── Acciones ──────────────────────────────────────────────────
  abrirAcciones():  void { this.mostrarAcciones = true;  this.cdr.markForCheck(); }
  cerrarAcciones(): void { this.mostrarAcciones = false; this.cdr.markForCheck(); }

  /** El jugador solo puede ordenar cuando no está terminada la mano y el compañero tiene cartas. */
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
        this.http.post<ManoTruco3v3>(`${API}/ordenar-mayor`, { manoId: this.mano.id, jugadorId })
      );
      this.actualizarEstado(res);
      await this.correrMaquinas();
    } catch (e: any) {
      this.showToast(e?.error?.error ?? e?.error?.title ?? 'Error al enviar la orden.');
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
