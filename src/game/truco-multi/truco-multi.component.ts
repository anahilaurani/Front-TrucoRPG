import {
  Component, OnInit, OnDestroy,
  ChangeDetectorRef, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SalaService } from '../../app/services/sala.service';
import { Carta, Baza, Btn, Slot, TipoEnvido } from '../truco-solo/truco-solo.component';

// ── Tipos específicos multi ───────────────────────────────────────────────────

interface MultiEstado {
  numeroDeMano?: number;
  turnoActual: 'Humano' | 'Maquina';
  manoIniciadaPor?: 'Humano' | 'Maquina';
  ganadorMano?: 'Humano' | 'Maquina' | 'Parda';
  partidaTerminada?: boolean;
  ganadorPartida?: 'Humano' | 'Maquina';
  puntosHumano: number;
  puntosMaquina: number;
  estadoEnvido?: string;
  estadoTruco?: string;
  envidoCantado?: boolean;
  envidoResuelto?: boolean;
  tipoEnvidoCantado?: TipoEnvido;
  cantorEnvido?: string;
  tantoHumano?: number;
  tantoMaquina?: number;
  trucoCantado?: boolean;
  trucoResuelto?: boolean;
  nivelTruco?: number;
  puntosTrucoMano?: number;
  cantorTruco?: string;
  bazas: Baza[];
  cartaPendienteJ1?: Carta;
  cartaPendienteJ2?: Carta;
  envidoPendienteJ1: boolean;
  envidoPendienteJ2: boolean;
  trucoPendienteJ1: boolean;
  trucoPendienteJ2: boolean;
}

interface MultiMsg {
  miRol: 'J1' | 'J2';
  misManos: Carta[];
  misJugadas: Carta[];
  cantidadCartasOponente: number;
  estado: MultiEstado;
}

interface FanCard { carta: Carta | null; visible: boolean; seleccionada: boolean; }


@Component({
  selector: 'app-truco-multi',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './truco-multi.component.html',
  styleUrls: ['../truco-solo/truco-solo.component.css', './truco-multi.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrucoMultiComponent implements OnInit, OnDestroy {
  // ── Estado ─────────────────────────────────────────────────────
  msg: MultiMsg | null = null;
  rol: 'J1' | 'J2' = 'J1';

  btns: Btn[] = [];
  slots: Slot[] = [];
  misCarts: FanCard[] = [
    { carta: null, visible: false, seleccionada: false },
    { carta: null, visible: false, seleccionada: false },
    { carta: null, visible: false, seleccionada: false },
  ];
  opCards: { visible: boolean }[] = [];

  tallySticks: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
  turnoBadge  = '';
  bubbleText  = '';
  toastMsg    = '';
  toastTipo: 'error' | 'info' = 'error';
  gameOver    = false;
  gameOverWon = false;
  mostrarConfirmSalir = false;

  readonly fanAngles = [-12, 0, 12];
  readonly fanXOff   = [-18, 0, 18];

  private prevEstadoEnvido   = '';
  private prevEstadoTruco    = '';
  private prevPendEnv        = false;
  private prevPendTru        = false;
  private prevEnvidoResuelto = false;
  private bubbleTimer: ReturnType<typeof setTimeout> | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private nuevaManoTimer: ReturnType<typeof setTimeout> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private prevGanadorMano: string | null = null;
  countdown: number | null = null;
  private subs: Subscription[] = [];

  constructor(
    private sala: SalaService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.sala.trucoEstado$.subscribe(data => {
        if (!data) return;
        this.onEstado(data as MultiMsg);
      }),
      this.sala.jugadorDesconectado$.subscribe(v => {
        if (v) this.showToast('El oponente se desconectó.');
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.bubbleTimer)   clearTimeout(this.bubbleTimer);
    if (this.toastTimer)    clearTimeout(this.toastTimer);
    this.cancelarCountdown();
  }

  // ── Procesamiento del estado ──────────────────────────────────
  private onEstado(data: MultiMsg): void {
    this.rol = data.miRol;
    this.msg = data;
    const e  = data.estado;

    const esJ1      = this.rol === 'J1';
    const pendEnv   = esJ1 ? e.envidoPendienteJ1 : e.envidoPendienteJ2;
    const pendTru   = esJ1 ? e.trucoPendienteJ1  : e.trucoPendienteJ2;
    const esMiTurno = esJ1 ? e.turnoActual === 'Humano' : e.turnoActual === 'Maquina';

    // Cartas propias
    const totalCartas = 3;
    for (let i = 0; i < totalCartas; i++) {
      const carta = data.misManos[i] ?? null;
      this.misCarts[i] = { carta, visible: !!carta, seleccionada: false };
    }

    // Cartas oponente
    this.opCards = Array.from({ length: data.cantidadCartasOponente }, () => ({ visible: true }));

    // Slots de bazas
    this.slots = (e.bazas ?? []).map(b => ({
      jugador: esJ1 ? b.cartaJugador : b.cartaMaquina,
      maquina: esJ1 ? b.cartaMaquina : b.cartaJugador,
      pending: false,
      winner:  b.ganador === 'Humano'  ? (esJ1 ? 'Humano' : 'Maquina') :
               b.ganador === 'Maquina' ? (esJ1 ? 'Maquina' : 'Humano') : 'Parda',
    } as Slot));

    // Cartas pendientes en mesa (aún no resueltas en baza)
    const miCartaPend    = esJ1 ? e.cartaPendienteJ1 : e.cartaPendienteJ2;
    const rivalCartaPend = esJ1 ? e.cartaPendienteJ2 : e.cartaPendienteJ1;
    if (miCartaPend || rivalCartaPend) {
      this.slots.push({
        jugador: miCartaPend    ?? undefined,
        maquina: rivalCartaPend ?? undefined,
        pending: true,
      } as Slot);
    }

    // Badge de turno
    if (e.ganadorMano) {
      const ganador = e.ganadorMano === 'Parda' ? 'Parda'
        : ((e.ganadorMano === 'Humano') === esJ1) ? '¡Ganaste la mano!' : 'Perdiste la mano.';
      this.turnoBadge = ganador;
    } else if (e.partidaTerminada) {
      this.turnoBadge = '';
    } else if (e.trucoCantado && e.trucoResuelto && esMiTurno) {
      this.turnoBadge = 'Truco aceptado – jugá una carta';
    } else {
      this.turnoBadge = esMiTurno ? 'Tu turno – jugá una carta o cantá' : 'Esperá tu turno...';
    }

    // Game Over
    if (e.partidaTerminada && !this.gameOver) {
      this.gameOver    = true;
      this.gameOverWon = (e.ganadorPartida === 'Humano') === esJ1;
    }

    // Tanteador
    this.redrawTally(e.puntosHumano, e.puntosMaquina);

    // Botones
    this.buildBtns(data, pendEnv, pendTru, esMiTurno, esJ1);

    // Burbuja
    this.updateBubble(e, pendEnv, pendTru);

    // Auto nueva mano con countdown: solo el jugador "mano" dispara el invoke
    // (mismo patrón que 2v2/3v3), el otro recibe el broadcast. El botón manual
    // y el guard del hub quedan como respaldo.
    const manoTermino = !!e.ganadorMano && !e.partidaTerminada;
    const esManoNueva = e.ganadorMano !== this.prevGanadorMano;
    const soyElMano   = (e.manoIniciadaPor === 'Humano') === esJ1;
    if (manoTermino && esManoNueva && soyElMano) {
      this.iniciarCountdown(() => {
        // Recheck: si mientras corría el countdown llegó otra mano o terminó la
        // partida, no invocar.
        const est = this.msg?.estado;
        if (est?.ganadorMano && !est.partidaTerminada) this.hub('NuevaMano');
      });
    } else if (!e.ganadorMano) {
      this.cancelarCountdown();
    }
    this.prevGanadorMano = e.ganadorMano ?? null;

    // Guardar prev
    this.prevEstadoEnvido   = e.estadoEnvido   ?? '';
    this.prevEstadoTruco    = e.estadoTruco    ?? '';
    this.prevPendEnv        = pendEnv;
    this.prevPendTru        = pendTru;
    this.prevEnvidoResuelto = !!e.envidoResuelto;

    this.cdr.markForCheck();
  }

  // ── Botones ──────────────────────────────────────────────────
  private buildBtns(data: MultiMsg, pendEnv: boolean, pendTru: boolean, esMiTurno: boolean, esJ1: boolean): void {
    const e       = data.estado;
    const manoEnd = !!e.ganadorMano || !!e.partidaTerminada;
    const raw: [string, string, (() => void) | null][] = [];

    if (e.partidaTerminada) {
      raw.push(['Nueva partida', '#226622', () => this.hub('NuevaPartida')]);

    } else if (e.ganadorMano) {
      raw.push(['Nueva mano', '#cc8800', () => this.nuevaManoManual()]);

    } else if (pendEnv) {
      raw.push(['QUIERO', '#44ff44', () => this.hub('ResponderEnvido', true)]);
      const tipo = e.tipoEnvidoCantado;
      if (tipo === 'Envido')
        raw.push(['ENVIDO', '#ffdd00', () => this.hub('EscalarEnvido', 'Envido Envido')]);
      if (tipo === 'Envido' || tipo === 'EnvidoEnvido')
        raw.push(['REAL ENVIDO', '#ffaa00', () => this.hub('EscalarEnvido', 'Real Envido')]);
      if (tipo !== 'FaltaEnvido' && tipo !== 'Falta Envido')
        raw.push(['FALTA ENVIDO', '#ff8800', () => this.hub('EscalarEnvido', 'Falta Envido')]);
      raw.push(['SON BUENAS', '#ffaa00', () => this.hub('SonBuenas')]);
      raw.push(['NO QUIERO', '#ff4444', () => this.hub('ResponderEnvido', false)]);

    } else if (pendTru) {
      raw.push(['QUIERO', '#44ff44', () => this.hub('ResponderTruco', true, null)]);
      if ((e.nivelTruco ?? 0) < 3) {
        const lbl = e.nivelTruco === 1 ? 'RETRUCO' : 'VALE 4';
        const esc = e.nivelTruco === 1 ? 'retruco' : 'valecuatro';
        raw.push([lbl, '#ffaa00', () => this.hub('ResponderTruco', true, esc)]);
      }
      raw.push(['NO QUIERO', '#ff4444', () => this.hub('ResponderTruco', false, null)]);
      const miCartaPendTru = esJ1 ? e.cartaPendienteJ1 : e.cartaPendienteJ2;
      if (!e.envidoCantado && (e.bazas?.length ?? 0) === 0 && !miCartaPendTru) {
        raw.push(['Envido',       '#4488ff', () => this.hub('SolicitarEnvido', 'Envido')]);
        raw.push(['Real Envido',  '#4488ff', () => this.hub('SolicitarEnvido', 'Real Envido')]);
        raw.push(['Falta Envido', '#4488ff', () => this.hub('SolicitarEnvido', 'Falta Envido')]);
      }

    } else {
      // Envido solo posible antes de que se cante truco (o mientras se responde truco)
      const envidoPosible = !e.envidoCantado && !e.trucoCantado
        && (e.bazas?.length ?? 0) === 0 && !manoEnd;
      if (envidoPosible) {
        raw.push(['Envido',       '#4488ff', esMiTurno ? () => this.hub('SolicitarEnvido', 'Envido')       : null]);
        raw.push(['Real Envido',  '#4488ff', esMiTurno ? () => this.hub('SolicitarEnvido', 'Real Envido')  : null]);
        raw.push(['Falta Envido', '#4488ff', esMiTurno ? () => this.hub('SolicitarEnvido', 'Falta Envido') : null]);
      }
      if (!e.trucoCantado && !manoEnd) {
        raw.push(['Truco', '#dd4422', esMiTurno ? () => this.hub('SolicitarTruco') : null]);
      } else if (e.trucoCantado && (e.nivelTruco ?? 0) < 3 && !manoEnd
                 && !(e.trucoPendienteJ1 || e.trucoPendienteJ2)) {
        // Puedo escalar si no soy el cantor actual y es mi turno
        const soyCantor = (e.cantorTruco === 'Humano') === esJ1;
        if (!soyCantor) {
          const lbl = e.nivelTruco === 1 ? 'Retruco' : 'Vale 4';
          raw.push([lbl, '#dd4422', esMiTurno ? () => this.hub('EscalarTruco') : null]);
        }
      }
      if (!manoEnd) {
        raw.push(['Ir al mazo', '#884422', esMiTurno ? () => this.irAlMazo() : null]);
      }
    }

    this.btns = raw.map(([label, color, action]) => ({
      label, color, enabled: action !== null, action,
    }));
  }

  // ── Acciones hub ─────────────────────────────────────────────
  jugarCarta(idx: number): void {
    const fc = this.misCarts[idx];
    if (!fc?.carta) return;
    const esJ1      = this.rol === 'J1';
    const e         = this.msg?.estado;
    if (!e) return;
    const esMiTurno = esJ1 ? e.turnoActual === 'Humano' : e.turnoActual === 'Maquina';

    const miEnvidoPend = esJ1 ? e.envidoPendienteJ1 : e.envidoPendienteJ2;
    const miTrucoPend  = esJ1 ? e.trucoPendienteJ1  : e.trucoPendienteJ2;
    if (miEnvidoPend || miTrucoPend) {
      this.showToast('No podés jugar: primero respondé el canto.', 'info');
      return;
    }
    if (e.envidoPendienteJ1 || e.envidoPendienteJ2 || e.trucoPendienteJ1 || e.trucoPendienteJ2) {
      this.showToast('Esperá la respuesta del rival.', 'info');
      return;
    }
    if (!esMiTurno) { this.showToast('Esperá tu turno para jugar.', 'info'); return; }
    this.hub('JugarCarta', fc.carta.numero, fc.carta.palo);
  }

  private irAlMazo(): void {
    this.showTempBubble('Me voy al mazo.', 1500);
    setTimeout(() => this.hub('IrseAlMazo'), 300);
  }

  private hub(method: string, ...args: unknown[]): void {
    this.sala.invocarHub(method, ...args).catch(err => {
      this.showToast(`Error: ${err?.message ?? err}`);
    });
  }

  // ── Tanteador ────────────────────────────────────────────────
  private redrawTally(ptsVos: number, ptsMaq: number): void {
    const sticks: typeof this.tallySticks = [];
    this.drawPalitos(sticks, 36,  Math.min(ptsVos, 15), false, 4);
    this.drawPalitos(sticks, 124, Math.min(ptsMaq, 15), true,  4);
    if (ptsVos > 15) this.drawPalitos(sticks, 36,  ptsVos - 15, false, 58);
    if (ptsMaq > 15) this.drawPalitos(sticks, 124, ptsMaq - 15, true,  58);
    this.tallySticks = sticks;
  }

  private drawPalitos(out: typeof this.tallySticks, cx: number, pts: number, isMaq: boolean, yTop: number): void {
    if (pts <= 0) return;
    const color = isMaq ? '#d46010' : '#c8a030';
    const BS = 16, BGAP = 4, SL = 10, SGAP = 4;
    const full = Math.floor(pts / 5), rem = pts % 5;
    if (full > 0) {
      const totalW = full * BS + (full - 1) * BGAP;
      let bx = cx - totalW / 2;
      for (let i = 0; i < full; i++) {
        this.stick(out, bx, yTop+BS, bx, yTop, color);
        this.stick(out, bx, yTop, bx+BS, yTop, color);
        this.stick(out, bx+BS, yTop, bx+BS, yTop+BS, color);
        this.stick(out, bx+BS, yTop+BS, bx, yTop+BS, color);
        this.stick(out, bx, yTop+BS, bx+BS, yTop, color);
        bx += BS + BGAP;
      }
    }
    if (rem > 0) {
      const totalW = rem * SL + (rem - 1) * SGAP;
      let sx = cx - totalW / 2;
      const sy = full > 0 ? yTop + BS + 4 : yTop + 4;
      for (let i = 0; i < rem; i++) {
        this.stick(out, sx, sy+SL, sx+SL, sy, color);
        sx += SL + SGAP;
      }
    }
  }

  private stick(out: typeof this.tallySticks, x1: number, y1: number, x2: number, y2: number, color: string): void {
    out.push({ x1, y1, x2, y2, color });
  }

  // ── Burbuja ──────────────────────────────────────────────────
  private updateBubble(e: MultiEstado, pendEnv: boolean, pendTru: boolean): void {
    const envidoChanged = (e.estadoEnvido ?? '') !== this.prevEstadoEnvido;
    const trucoChanged  = (e.estadoTruco  ?? '') !== this.prevEstadoTruco;

    if (pendTru || pendEnv) {
      if (pendTru && envidoChanged && e.envidoCantado && !this.prevPendEnv) {
        const txt = (e.estadoEnvido ?? '').toLowerCase();
        let rsp = txt.includes('no quiso') || txt.includes('no quiere') ? '¡No quiero!'
          : txt.includes('quiso') || txt.includes('quiere') ? '¡Quiero!' : '';
        if (rsp) { this.showTempBubble(rsp, 2000); return; }
      }
      if (this.bubbleTimer) { clearTimeout(this.bubbleTimer); this.bubbleTimer = null; }
      const txt = this.cantoBubbleText(e, pendTru, pendEnv);
      if (txt) this.showBubble(txt);
    } else {
      let resp = '';
      if (trucoChanged && e.trucoCantado && !this.prevPendTru) {
        const t = (e.estadoTruco ?? '').toLowerCase();
        resp = t.includes('no quiso') || t.includes('no quiere') ? '¡No quiero!'
          : t.includes('quiso') || t.includes('quiere') || t.includes('acepto') ? '¡Quiero!' : '';
      } else if (envidoChanged && e.envidoCantado) {
        const ev = (e.estadoEnvido ?? '').toLowerCase();
        const justResolved = !!e.envidoResuelto && !this.prevEnvidoResuelto;
        if (ev.includes('no quiso') || ev.includes('no quiere')) {
          resp = '¡No quiero!';
        } else if (justResolved) {
          const esJ1      = this.rol === 'J1';
          const miTanto   = esJ1 ? e.tantoHumano : e.tantoMaquina;
          const tantoRival = esJ1 ? e.tantoMaquina : e.tantoHumano;
          // Toast con ambos tantos — garantiza que ambas pantallas lo vean
          if (miTanto != null && tantoRival != null) {
            this.showToast(`Envido — Vos: ${miTanto} | Rival: ${tantoRival}`);
          }
          // Burbuja: el rival dice su tanto
          resp = this.prevPendEnv
            ? (tantoRival != null ? `Tengo ${tantoRival}.` : '')
            : (tantoRival != null ? `¡Quiero! Tengo ${tantoRival}.` : '¡Quiero!');
        } else if (ev.includes('quiso') || ev.includes('quiere') || ev.includes('acepto')) {
          resp = '¡Quiero!';
        }
      }
      if (resp) {
        this.showTempBubble(resp, 2500);
      } else if (!this.bubbleTimer) {
        this.bubbleText = '';
      }
    }
  }

  private cantoBubbleText(e: MultiEstado, pendTru: boolean, pendEnv: boolean): string {
    if (pendEnv) {
      const nombres: Record<string, string> = {
        Envido: 'Envido', EnvidoEnvido: 'Envido Envido',
        RealEnvido: 'Real Envido', FaltaEnvido: 'Falta Envido',
      };
      const tipo = nombres[e.tipoEnvidoCantado ?? 'Envido'] ?? e.tipoEnvidoCantado ?? 'Envido';
      return `¡${tipo}!`;
    }
    if (pendTru) {
      const nivel = e.nivelTruco ?? 1;
      return nivel === 1 ? '¡Truco!' : nivel === 2 ? '¡Retruco!' : '¡Vale Cuatro!';
    }
    return '';
  }

  private showBubble(txt: string): void {
    this.bubbleText = txt;
    this.cdr.markForCheck();
  }

  private showTempBubble(txt: string, ms: number): void {
    if (this.bubbleTimer) { clearTimeout(this.bubbleTimer); this.bubbleTimer = null; }
    this.bubbleText = txt;
    this.cdr.markForCheck();
    this.bubbleTimer = setTimeout(() => {
      this.bubbleText  = '';
      this.bubbleTimer = null;
      this.cdr.markForCheck();
    }, ms);
  }

  // ── Game over / salir ─────────────────────────────────────────
  nuevaManoManual(): void {
    this.cancelarCountdown();
    this.hub('NuevaMano');
  }

  private iniciarCountdown(onComplete: () => void): void {
    this.cancelarCountdown();
    this.countdown = 3;
    this.cdr.markForCheck();
    this.countdownInterval = setInterval(() => {
      this.countdown = (this.countdown ?? 1) - 1;
      this.cdr.markForCheck();
      if (this.countdown <= 0) {
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

  nuevaPartida(): void { this.gameOver = false; this.hub('NuevaPartida'); }

  salirPartida(): void { this.mostrarConfirmSalir = true; }

  async confirmarSalir(): Promise<void> {
    this.mostrarConfirmSalir = false;
    await this.sala.abandonar();
    // Desde historia: cerrar el overlay y volver a la pulpería (sin navegar).
    if (localStorage.getItem('multiEnHistoria') === '1') {
      localStorage.removeItem('multiEnHistoria');
      window.dispatchEvent(new CustomEvent('truco-multi:end'));
      return;
    }
    const volverASala = localStorage.getItem('origenSalaMulti') === '1';
    localStorage.removeItem('origenSalaMulti');
    this.router.navigate([volverASala ? '/multijugador-mapa' : '/home']);
  }

  cancelarSalir(): void { this.mostrarConfirmSalir = false; }

  // ── Utils ─────────────────────────────────────────────────────
  cardImg(c: Carta): string {
    const mapaNumeros: Record<number, number> = {
      1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 10: 8, 11: 9, 12: 10
    };
    const offsetPalo: Record<string, number> = { Oro: 0, Copa: 10, Espada: 20, Basto: 30 };
    return `assets/cards/${offsetPalo[c.palo] + mapaNumeros[c.numero]}.PNG`;
  }

  private showToast(msg: string, tipo: 'error' | 'info' = 'error'): void {
    this.toastMsg  = msg;
    this.toastTipo = tipo;
    this.cdr.markForCheck();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastMsg = ''; this.cdr.markForCheck(); }, tipo === 'info' ? 2600 : 4000);
  }

  get puntosVos(): number {
    if (!this.msg) return 0;
    return this.rol === 'J1' ? this.msg.estado.puntosHumano : this.msg.estado.puntosMaquina;
  }

  get puntosRival(): number {
    if (!this.msg) return 0;
    return this.rol === 'J1' ? this.msg.estado.puntosMaquina : this.msg.estado.puntosHumano;
  }
}
