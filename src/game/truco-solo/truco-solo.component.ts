import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { OPONENTES } from '../data/oponente';
import { FaseOponente } from '../../app/interfaces/faseOponente';
import { Creditos } from '../../app/pages/creditos/creditos';

// ── Tipos ────────────────────────────────────────────────────────────────────

export type Palo = 'Oro' | 'Espada' | 'Copa' | 'Basto';
export type TipoEnvido = 'Envido' | 'EnvidoEnvido' | 'Real Envido' | 'RealEnvido' | 'Falta Envido' | 'FaltaEnvido';

export interface Carta {
  numero: number;
  palo: Palo;
  valorTruco: number;
  valorEnvido: number;
}

export interface Baza {
  cartaJugador?: Carta;
  cartaMaquina?: Carta;
  ganador?: 'Humano' | 'Maquina' | 'Parda';
}

export interface VistaHabilidades {
  activaDisponible: boolean;
  activaUsadaEnEstaMano: boolean;
  habilidadesActivasEnPartida: boolean;
  claseHeroe?: number;
  nombreHeroe?: string;
  ultimoMensajeHabilidad?: string;
  cartaReveladaRival?: { numero: number; palo: string; valorTruco: number };
}

export interface VistaHabilidadesRival {
  habilidadesActivasEnPartida: boolean;
  salpicaduraActiva: boolean;
  salpicaduraBloqueando: boolean;
  travesuraActiva: boolean;
  travesuraBloqueando: boolean;
  rasgunoActivo?: boolean;
  rasgunoBloqueando?: boolean;
  aullidoBloqueando?: boolean;
  destelloBloqueando?: boolean;
  espejismoActivo?: boolean;
  espejismoBloqueando?: boolean;
  espejismoAlternando?: boolean;
  espejismoMostrarFakePrimero?: boolean;
  espejismoCartaFalsa?: { numero: number; palo: string };
  cartasOcultasTravesura?: { numero: number; palo: string }[];
  mandingaFase2Desbloqueada?: boolean;
  mandingaFase3Desbloqueada?: boolean;
  mandingaEspejoBloqueando?: boolean;
  mandingaEnganoBloqueando?: boolean;
  mandingaEnganoManoOculta?: boolean;
  mandingaMaldicionBloqueando?: boolean;
  mandingaMaldicionActivaEnMano?: boolean;
  ultimoMensajeHabilidad?: string;
}

export interface ManoState {
  id: string;
  humano: { mano: Carta[] };
  maquina: { mano: Carta[] };
  bazas: Baza[];
  turnoActual: 'Humano' | 'Maquina';
  puntosHumano: number;
  puntosMaquina: number;
  estadoEnvido?: string;
  estadoTruco?: string;
  envidoCantado?: boolean;
  trucoCantado?: boolean;
  trucoResuelto?: boolean;
  nivelTruco?: number;
  cantorTruco?: 'Humano' | 'Maquina';
  tipoEnvidoCantado?: TipoEnvido;
  tantoCantadoMaquina?: number;
  tantoHumano?: number;
  envidoResuelto?: boolean;
  cantorEnvido?: 'Humano' | 'Maquina';
  ganadorEnvido?: 'Humano' | 'Maquina';
  manoIniciadaPor?: 'Humano' | 'Maquina';
  sonBuenasDeclarado?: boolean;
  ganadorMano?: 'Humano' | 'Maquina' | 'Parda';
  ganadorPartida?: 'Humano' | 'Maquina';
  partidaTerminada?: boolean;
  envidoPendienteRespuestaHumano?: boolean;
  trucoPendienteRespuestaHumano?: boolean;
  cartaMaquinaEnMesa?: Carta;
  cartaHumanoEnMesa?: Carta;
  numeroDeMano?: number;
  configuracion?: { modo: number; heroeDelHumano?: number; rivalDeLaMaquina?: number; rivalNivel?: number };
  vistaHabilidadesHumano?: VistaHabilidades;
  vistaHabilidadesRival?: VistaHabilidadesRival;
  salpicaduraActiva?: boolean;
  salpicaduraBloqueando?: boolean;
  travesuraActiva?: boolean;
  travesuraBloqueando?: boolean;
  rasgunoActivo?: boolean;
  rasgunoBloqueando?: boolean;
  aullidoBloqueando?: boolean;
  destelloBloqueando?: boolean;
  espejismoActivo?: boolean;
  espejismoBloqueando?: boolean;
  espejismoAlternando?: boolean;
  espejismoMostrarFakePrimero?: boolean;
  espejismoCartaFalsa?: Carta;
  cartasOcultasTravesura?: { numero: number; palo: string }[];
  mandingaFase2Desbloqueada?: boolean;
  mandingaFase3Desbloqueada?: boolean;
  mandingaEspejoBloqueando?: boolean;
  mandingaEnganoBloqueando?: boolean;
  mandingaEnganoManoOculta?: boolean;
  mandingaMaldicionBloqueando?: boolean;
  mandingaMaldicionActivaEnMano?: boolean;
}

export interface Btn {
  label: string;
  color: string;
  enabled: boolean;
  action: (() => void) | null;
}

export interface Slot {
  jugador?: Carta;
  maquina?: Carta;
  pending: boolean;
  espejismoOculto?: boolean;
  espejismoParpadeo?: boolean;
  winner?: 'Humano' | 'Maquina' | 'Parda';
}

export interface OpCardDisplay {
  visible: boolean;
  revelada: boolean;
  carta: Carta | null;
}

// ── Héroe ─────────────────────────────────────────────────────────────────────

export interface Heroe {
  id: number;
  nombre: string;
  color: string;
  descripcion: string;
}

export interface Rival {
  id: string;
  nivel: number;
  nombre: string;
  descripcion: string;
  nombreHabilidad: string;
  descripcionHabilidad: string;
  tipoRival: number;
  tipoHabilidad: number;
}

const HEROES: Heroe[] = [
  { id: 0, nombre: 'Manipulador', color: '#aa66ff', descripcion: 'Cada 3 manos: reemplazá 1 carta por otra del mazo (nunca de menor valor).' },
  { id: 1, nombre: 'Timbero', color: '#ffaa44', descripcion: 'Antes de jugar: apostá. Si ganás la mano, duplicás puntos; si perdés, rival +2.' },
  { id: 2, nombre: 'Fanfarrón', color: '#44aaff', descripcion: 'Tu próximo envido o truco aceptado vale +1 punto extra.' },
  { id: 3, nombre: 'Mentiroso', color: '#66dd88', descripcion: 'Cada 2 manos: al inicio, revelás 1 carta aleatoria del rival.' },
];

// ── Constantes ───────────────────────────────────────────────────────────────

const PALO_SYM: Record<Palo, string> = { Oro: '★', Espada: '†', Copa: '♦', Basto: '♣' };
const API = '/api/truco';
const API_HISTORIA = '/api/historia';
const FAN_ANGLES = [-16, 0, 16];
const FAN_X = [-84, 0, 84];
const SALPICADURA_REVEAL_SEG = 5;
const TRAVESURA_REVEAL_SEG = 5;
const RASGUNO_REVEAL_SEG = 3;
const AULLIDO_REVEAL_SEG = 3;
const DESTELLO_REVEAL_SEG = 3;
const ESPEJISMO_REVEAL_SEG = 3;
const ESPEJISMO_PARPADEO_MS = 2000;
const MANDINGA_ESPEJO_SEG = 3;
const MANDINGA_ENGANO_SEG = 5;
const MANDINGA_MALDICION_SEG = 3;

const RIVAL_BATALLA_ARCHIVO: Record<string, string> = {
  mandinga: 'Mandinga_batalla.png',
};

const RIVAL_NIVEL_SLUG: Record<number, string> = {
  1: 'nahuelito',
  2: 'pomberito',
  3: 'lobizon',
  4: 'luzmala',
  5: 'mandinga',
};

// ── Componente ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-truco-solo',
  standalone: true,
  imports: [CommonModule, NgStyle, Creditos],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './truco-solo.component.html',
  styleUrl: './truco-solo.component.css',
})
export class TrucoSoloComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('gauchoVideo') gauchoVideo!: ElementRef<HTMLVideoElement>;

  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // ── Estado del juego ─────────────────────────────────────────────────────
  mano: ManoState | null = null;

  // ── Héroe ─────────────────────────────────────────────────────────────────
  heroe: Heroe | null = null;

  rival: Rival | null = null;

  /** Pantalla de combate contra jefe: oculta el layout hasta cargar assets + mano inicial. */
  combateListo = false;
  rivalNivel: number | null = null;

  // Índice de la carta seleccionada para el Manipulador (claseHeroe === 0)
  habilidadCartaIdx: number | null = null;

  // true cuando el jugador tocó "Usar habilidad" y esperamos que elija una carta (solo Manipulador)
  modoSeleccionCarta = false;

  // Líneas del log de eventos de habilidad (se acumulan durante la partida)
  eventosHabilidad: string[] = [];

  get vista(): VistaHabilidades | undefined {
    return this.mano?.vistaHabilidadesHumano;
  }

  get vistaRival(): VistaHabilidadesRival | undefined {
    return this.mano?.vistaHabilidadesRival;
  }

  /** SOLO PRUEBAS — Atajo oculto (tecla P) para victoria automática en historia. */
  get puedeUsarGanarAutomaticoDebug(): boolean {
    return this.esPartidaHistoria(this.mano) && !this.gameOver && !!this.mano;
  }

  /** SOLO PRUEBAS — Atajo oculto (tecla O) para sumar 10 puntos contra Mandinga. */
  get puedeUsarGanar10PuntosDebug(): boolean {
    return this.puedeUsarGanarAutomaticoDebug && this.esMandinga;
  }

  @HostListener('document:keydown', ['$event'])
  onDebugKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;

    if (event.key === 'p' || event.key === 'P') {
      if (!this.puedeUsarGanarAutomaticoDebug) return;
      this.ganarAutomaticoDebug();
      return;
    }

    if (event.key === 'o' || event.key === 'O') {
      if (!this.puedeUsarGanar10PuntosDebug) return;
      this.ganar10PuntosDebug();
    }
  }

  get accionesBloqueadasPorHabilidadRival(): boolean {
    const m = this.mano;
    return this.salpicaduraRevelando
      || this.travesuraRevelando
      || this.rasgunoRevelando
      || this.rasgunoConfirmando
      || this.destelloRevelando
      || this.espejismoRevelando
      || this.mandingaEspejoRevelando
      || this.mandingaEnganoRevelando
      || this.mandingaMaldicionRevelando
      || this.aullidoRevelando
      || !!this.vistaRival?.salpicaduraBloqueando
      || !!this.vistaRival?.travesuraBloqueando
      || !!this.vistaRival?.rasgunoBloqueando
      || !!this.vistaRival?.aullidoBloqueando
      || !!this.vistaRival?.destelloBloqueando
      || !!this.vistaRival?.espejismoBloqueando
      || !!this.vistaRival?.mandingaEspejoBloqueando
      || !!this.vistaRival?.mandingaEnganoBloqueando
      || !!this.vistaRival?.mandingaMaldicionBloqueando
      || !!m?.salpicaduraBloqueando
      || !!m?.travesuraBloqueando
      || !!m?.rasgunoBloqueando
      || !!m?.aullidoBloqueando
      || !!m?.destelloBloqueando
      || !!m?.espejismoBloqueando
      || !!m?.mandingaEspejoBloqueando
      || !!m?.mandingaEnganoBloqueando
      || !!m?.mandingaMaldicionBloqueando;
  }

  /** @deprecated usar accionesBloqueadasPorHabilidadRival */
  get accionesBloqueadasPorSalpicadura(): boolean {
    return this.accionesBloqueadasPorHabilidadRival;
  }

  salpicaduraRevelando = false;
  salpicaduraSegundos = 0;
  travesuraRevelando = false;
  travesuraSegundos = 0;
  rasgunoRevelando = false;
  rasgunoSegundos = 0;
  aullidoRevelando = false;
  aullidoSegundos = 0;
  destelloRevelando = false;
  destelloSegundos = 0;
  espejismoRevelando = false;
  espejismoSegundos = 0;
  espejismoMostrarFake = false;
  espejismoParpadeoAnim = false;
  mandingaEspejoRevelando = false;
  mandingaEspejoSegundos = 0;
  mandingaEnganoRevelando = false;
  mandingaEnganoSegundos = 0;
  mandingaMaldicionRevelando = false;
  mandingaMaldicionSegundos = 0;
  private salpicaduraCartasOriginales: Carta[] = [];
  private rasgunoCartasOriginales: Carta[] = [];

  // Habilidad disponible = el backend dice que está lista y no fue usada esta mano
  get habilidadDisponible(): boolean {
    const v = this.vista;
    if (!this.heroe || !v?.habilidadesActivasEnPartida) return false;
    return !!v.activaDisponible && !v.activaUsadaEnEstaMano;
  }

  // True cuando el jugador tocó el botón y el Manipulador espera que elija carta
  get manipuladorEsperandoCarta(): boolean {
    return !!this.heroe && this.heroe.id === 0 && this.modoSeleccionCarta;
  }

  // ── Modo práctica ─────────────────────────────────────────────────────────
  escenarioPractica: number | null = null;
  cartasBrillan: boolean[] = [false, false, false];
  btnsBrillan: boolean[] = [];
  tutorialMsg = '';

  // ── UI ───────────────────────────────────────────────────────────────────
  btns: Btn[] = [];
  slots: Slot[] = [{ pending: false }, { pending: false }, { pending: false }];
  opCards: OpCardDisplay[] = [
    { visible: true, revelada: false, carta: null },
    { visible: true, revelada: false, carta: null },
    { visible: true, revelada: false, carta: null },
  ];
  misCarts: { carta: Carta | null; visible: boolean; seleccionada: boolean; oculta: boolean }[] = [
    { carta: null, visible: false, seleccionada: false, oculta: false },
    { carta: null, visible: false, seleccionada: false, oculta: false },
    { carta: null, visible: false, seleccionada: false, oculta: false },
  ];

  rivalLabel = 'Esperando mano...';
  turnoBadge = '';
  bubbleText = '';
  bubbleHumanoText = '';
  gameOver = false;
  gameOverWon = false;
  toastMsg = '';
  toastTipo: 'error' | 'info' = 'error';

  readonly fanAngles = FAN_ANGLES;
  readonly fanXOff = FAN_X;

  tallySticks: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];

  // ── Estado interno ────────────────────────────────────────────────────────
  private loading = false;
  private prevEstadoTruco = '';
  private prevEstadoEnvido = '';
  private prevPendTru = false;
  private prevPendEnv = false;
  private prevEnvidoResuelto = false;
  private prevGanadorMano: string | null = null;
  private nuevaManoTimer: ReturnType<typeof setTimeout> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  countdown: number | null = null;
  private bubbleTimer: ReturnType<typeof setTimeout> | null = null;
  private bubbleHumanoTimer: ReturnType<typeof setTimeout> | null = null;
  private envidoSeqTimers: ReturnType<typeof setTimeout>[] = [];
  private gameOverTimer: ReturnType<typeof setTimeout> | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private manoInicialRecibida = false;
  private assetsCombateListos = false;
  private salpicaduraManoId: string | null = null;
  private salpicaduraTimer: ReturnType<typeof setTimeout> | null = null;
  private salpicaduraInterval: ReturnType<typeof setInterval> | null = null;
  private travesuraManoId: string | null = null;
  private travesuraTimer: ReturnType<typeof setTimeout> | null = null;
  private travesuraInterval: ReturnType<typeof setInterval> | null = null;
  private rasgunoManoId: string | null = null;
  private rasgunoTimer: ReturnType<typeof setTimeout> | null = null;
  private rasgunoInterval: ReturnType<typeof setInterval> | null = null;
  private aullidoManoId: string | null = null;
  private aullidoTimer: ReturnType<typeof setTimeout> | null = null;
  private aullidoInterval: ReturnType<typeof setInterval> | null = null;
  private destelloManoId: string | null = null;
  private destelloTriggerKey: string | null = null;
  private destelloTimer: ReturnType<typeof setTimeout> | null = null;
  private destelloInterval: ReturnType<typeof setInterval> | null = null;
  private espejismoManoId: string | null = null;
  private espejismoTimer: ReturnType<typeof setTimeout> | null = null;
  private espejismoInterval: ReturnType<typeof setInterval> | null = null;
  private espejismoCountdownInterval: ReturnType<typeof setInterval> | null = null;
  private espejismoParpadeoTimeout: ReturnType<typeof setTimeout> | null = null;
  private mandingaEspejoManoId: string | null = null;
  private mandingaEspejoTimer: ReturnType<typeof setTimeout> | null = null;
  private mandingaEspejoInterval: ReturnType<typeof setInterval> | null = null;
  private mandingaEnganoManoId: string | null = null;
  private mandingaEnganoTimer: ReturnType<typeof setTimeout> | null = null;
  private mandingaEnganoInterval: ReturnType<typeof setInterval> | null = null;
  private mandingaMaldicionManoId: string | null = null;
  private mandingaMaldicionTimer: ReturnType<typeof setTimeout> | null = null;
  private mandingaMaldicionInterval: ReturnType<typeof setInterval> | null = null;
  private rasgunoWatchdog: ReturnType<typeof setInterval> | null = null;
  private rasgunoConfirmando = false;
  private nuevaManoEnCurso = false;
  private prevMensajeRival: string | null = null;
  private victoriaHistoriaRegistrada = false;
  private maquinaCorriendo = false;

  // ── Imagen del rival ──────────────────────────────────────────────────────

  // Slug normalizado del rival (ej. "El Pomberito" -> "pomberito"). Vacío si no hay rival.
  get rivalSlug(): string {
    if (this.rival?.nombre) {
      return this.rival.nombre
        .toLowerCase()
        .replace(/^(el|la|los|las)\s+/i, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '')
        .trim();
    }
    return this.obtenerSlugRivalDesdeNivel(this.rivalNivel);
  }

  get rivalSlugFondo(): string {
    const slug = this.rivalSlug;
    if (slug === 'luzmala') return 'lobizon';
    return slug || 'gaucho';
  }

  // Clase CSS por personaje para poder estilar cada uno por separado.
  get rivalImgClase(): string {
    return `rival-${this.rivalSlug || 'gaucho'}`;
  }

  get rivalImgSrc(): string {
    if (this.escenarioPractica !== null) return 'assets/gaucho.png';
    const slug = this.rivalSlug;
    if (!slug) return 'assets/gaucho.png';
    const archivo = RIVAL_BATALLA_ARCHIVO[slug] ?? `${slug}_batalla.png`;
    return `assets/oponentes1v1/${archivo}`;
  }

  get fondoStyle(): { [key: string]: string } {
    if (this.escenarioPractica !== null) {
      return { 'background-image': `url('assets/multijugador.png')` };
    }
    const slug = this.rivalSlugFondo;
    const img = slug && slug !== 'gaucho'
      ? `assets/fondos1v1/${slug}_fondo.png`
      : 'assets/multijugador.png';
    return { 'background-image': `url('${img}')` };
  }

  get esMandinga(): boolean {
    return this.rivalSlug === 'mandinga';
  }

  get rivalIconoPanel(): string {
    return this.esMandinga ? '😈' : '⚔';
  }

  readonly mandingaFaseLabels = ['I', 'II', 'III'] as const;

  get mandingaFases(): FaseOponente[] {
    return OPONENTES.find(o => o.id === 'mandinga')?.fases ?? [];
  }

  mandingaFaseDesbloqueada(index: number): boolean {
    if (index === 0) return true;
    if (index === 1) return this.mandingaFase2Activa;
    if (index === 2) return this.mandingaFase3Activa;
    return false;
  }

  mandingaFaseTipAbierta: number | null = null;
  mandingaFaseTipX = 0;
  mandingaFaseTipY = 0;

  abrirMandingaFaseTip(index: number, event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const anchoTip = 230;
    const margen = 8;
    let x = rect.right + 10;
    if (x + anchoTip > window.innerWidth - margen) {
      x = rect.left - anchoTip - 10;
    }
    this.mandingaFaseTipAbierta = index;
    this.mandingaFaseTipX = Math.max(margen, x);
    this.mandingaFaseTipY = rect.top + rect.height / 2;
    this.cdr.markForCheck();
  }

  cerrarMandingaFaseTip(): void {
    this.mandingaFaseTipAbierta = null;
    this.cdr.markForCheck();
  }

  get mandingaFase2Activa(): boolean {
    return !!(this.vistaRival?.mandingaFase2Desbloqueada);
  }

  get mandingaFase3Activa(): boolean {
    return !!(this.vistaRival?.mandingaFase3Desbloqueada);
  }

  get mandingaMaldicionActiva(): boolean {
    return !!(
      this.mano?.mandingaMaldicionActivaEnMano
      || this.vistaRival?.mandingaMaldicionActivaEnMano
    );
  }

  // ── Mini popups de info del panel derecho (habilidades) ───────────────────
  infoPopupTitulo: string | null = null;
  infoPopupLineas: string[] = [];

  abrirInfoPopup(titulo: string, lineas: string[]): void {
    this.infoPopupTitulo = titulo;
    this.infoPopupLineas = (lineas || []).filter(l => !!l);
    this.cdr.markForCheck();
  }

  cerrarInfoPopup(): void {
    this.infoPopupTitulo = null;
    this.infoPopupLineas = [];
    this.cdr.markForCheck();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngAfterViewInit(): void {
    const video = this.gauchoVideo?.nativeElement;
    if (video) {
      video.muted = true;
      video.play().catch(() => { });
    }
    this.rasgunoWatchdog = setInterval(() => this.revisarRasgunoPendiente(), 500);
    if (this.mano && this.rasgunoBloqueandoEn(this.mano)) {
      this.manejarRasguno(this.mano);
    }
  }

  ngOnInit(): void {
    const heroeIdStr = localStorage.getItem('heroeId');
    if (heroeIdStr !== null) {
      const id = parseInt(heroeIdStr, 10);
      this.heroe = HEROES.find(h => h.id === id) ?? null;
    }

    const rivalNivelStr = localStorage.getItem('rivalNivel');
    if (rivalNivelStr !== null) {
      this.rivalNivel = parseInt(rivalNivelStr, 10);
      this.hidratarRivalLocal(this.rivalNivel);
      this.cargarRival(this.rivalNivel);
      this.iniciarPrecargaCombate();
    } else {
      this.assetsCombateListos = true;
    }

    const escStr = localStorage.getItem('practicaEscenario');
    if (escStr !== null) {
      this.escenarioPractica = parseInt(escStr, 10);
      localStorage.removeItem('practicaEscenario');
    }

    this.cancelarSalpicaduraTimer();
    this.cancelarTravesuraTimer();
    this.cancelarRasgunoTimer();
    this.cancelarAullidoTimer();
    this.cancelarDestelloTimer();
    this.cancelarEspejismoTimers();
    this.cancelarMandingaTimers();
    this.rasgunoManoId = null;

    this.call('nuevaPartida', this.construirBodyPartida());
  }

  private cargarRival(nivel: number): void {
    this.http.get<Rival>(`${API_HISTORIA}/rivales/${nivel}`).subscribe({
      next: (rival) => {
        this.rival = {
          ...rival,
          descripcionHabilidad: this.formatearDescripcionRival(rival.descripcionHabilidad),
        };
        this.cdr.markForCheck();
      },
      error: () => {
        if (!this.rival) {
          this.hidratarRivalLocal(nivel);
        }
        this.showToast('No se pudo cargar los datos del rival.');
      },
    });
  }

  private obtenerSlugRivalDesdeNivel(nivel: number | null): string {
    if (nivel === null) return '';
    return RIVAL_NIVEL_SLUG[nivel] ?? '';
  }

  private hidratarRivalLocal(nivel: number): void {
    const oponente = OPONENTES[nivel - 1];
    if (!oponente) return;

    const habilidades = oponente.habilidades ?? [];
    const descripcionHabilidad = habilidades.length > 0
      ? habilidades.map(h => `${h.nombre}: ${h.texto}`).join(' ')
      : (oponente.fases?.map(f => `${f.titulo}: ${f.texto}`).join(' ') ?? oponente.intro);

    this.rival = {
      id: oponente.id,
      nivel,
      nombre: oponente.nombre,
      descripcion: oponente.intro,
      nombreHabilidad: habilidades[0]?.nombre ?? oponente.fases?.[0]?.titulo ?? '',
      descripcionHabilidad: this.formatearDescripcionRival(descripcionHabilidad),
      tipoRival: 0,
      tipoHabilidad: 0,
    };
  }

  private iniciarPrecargaCombate(): void {
    const slug = this.obtenerSlugRivalDesdeNivel(this.rivalNivel);
    if (!slug) {
      this.assetsCombateListos = true;
      this.evaluarCombateListo();
      return;
    }

    const fondoSlug = slug === 'luzmala' ? 'lobizon' : slug;
    const fondoUrl = `assets/fondos1v1/${fondoSlug}_fondo.png`;
    const batallaArchivo = RIVAL_BATALLA_ARCHIVO[slug] ?? `${slug}_batalla.png`;
    const rivalUrl = `assets/oponentes1v1/${batallaArchivo}`;

    Promise.all([
      this.preloadImagen(fondoUrl),
      this.preloadImagen(rivalUrl),
    ]).finally(() => {
      this.assetsCombateListos = true;
      this.evaluarCombateListo();
    });
  }

  private preloadImagen(src: string): Promise<void> {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = src;
    });
  }

  private evaluarCombateListo(): void {
    if (this.combateListo) return;
    if (this.rivalNivel === null) {
      this.combateListo = this.manoInicialRecibida;
    } else {
      this.combateListo = this.manoInicialRecibida && this.assetsCombateListos;
    }
    if (this.combateListo) {
      this.cdr.markForCheck();
    }
  }

  private construirBodyPartida(): Record<string, unknown> {
    const esHistoria = this.heroe !== null || this.rivalNivel !== null;
    const body: Record<string, unknown> = { modo: esHistoria ? 1 : 0 };
    if (this.heroe) body['claseHeroe'] = this.heroe.id;
    if (this.rivalNivel !== null) body['rivalNivel'] = this.rivalNivel;
    return body;
  }

  ngOnDestroy(): void {
    if (this.bubbleTimer) clearTimeout(this.bubbleTimer);
    if (this.bubbleHumanoTimer) clearTimeout(this.bubbleHumanoTimer);
    if (this.gameOverTimer) clearTimeout(this.gameOverTimer);
    if (this.derrotaFinalTimer) clearTimeout(this.derrotaFinalTimer);
    this.limpiarEnvidoSeq();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.cancelarCountdown();
    this.cancelarSalpicaduraTimer();
    this.cancelarTravesuraTimer();
    this.cancelarRasgunoTimer();
    this.cancelarAullidoTimer();
    this.cancelarDestelloTimer();
    this.cancelarEspejismoTimers();
    this.cancelarMandingaTimers();
    if (this.rasgunoWatchdog) {
      clearInterval(this.rasgunoWatchdog);
      this.rasgunoWatchdog = null;
    }
  }

  private revisarRasgunoPendiente(): void {
    const m = this.mano;
    if (!m || this.gameOver || this.rasgunoConfirmando) return;
    if (!this.rasgunoBloqueandoEn(m)) return;
    if (this.rasgunoManoId === m.id) return;
    this.manejarRasguno(m);
  }

  // ── Template helpers ──────────────────────────────────────────────────────
  sym(palo: Palo): string { return PALO_SYM[palo] ?? ''; }

  /** Quita sufijos "(Truco N)" de mensajes de habilidades del backend. */
  mensajeHabilidadLimpio(msg?: string | null): string {
    if (!msg) return '';
    return msg.replace(/\s*\(Truco\s+\d+\)/gi, '').trim();
  }

  private formatearDescripcionRival(desc: string): string {
    return desc.replace(/\s+Aullido:/, '\nAullido:');
  }

  cardImg(carta: Carta): string {
    const mapaNumeros: Record<number, number> = {
      1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 10: 8, 11: 9, 12: 10
    };
    const offsetPalo: Record<Palo, number> = { Oro: 0, Copa: 10, Espada: 20, Basto: 30 };
    return `assets/cards/${offsetPalo[carta.palo] + mapaNumeros[carta.numero]}.PNG`;
  }

  private cartaCoincide(a: { numero: number; palo: string }, b: { numero: number; palo: string }): boolean {
    return a.numero === b.numero
      && a.palo.localeCompare(b.palo, undefined, { sensitivity: 'accent' }) === 0;
  }

  private cartaDesdeRevelada(
    revelada: { numero: number; palo: string; valorTruco: number },
  ): Carta {
    return {
      numero: revelada.numero,
      palo: revelada.palo as Palo,
      valorTruco: revelada.valorTruco,
      valorEnvido: 0,
    };
  }

  // ── Delay "la máquina piensa" (compartido con 2v2/3v3 vía cfg_delay) ────────
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /** Delay (ms) configurable desde Configuración ("Delay de juego"). */
  private get delayMaquinaMs(): number {
    const raw = localStorage.getItem('cfg_delay');
    if (raw == null) return 1200; // default si nunca se configuró
    const v = Number(raw);
    return Number.isFinite(v) && v >= 0 ? v : 1200;
  }

  /** Acciones tras las cuales la máquina juega/responde → conviene simular que "piensa". */
  private readonly ENDPOINTS_PENSAR = new Set([
    'jugarCarta', 'cantarEnvido', 'cantarEnvidoTipo', 'responderEnvido',
    'sonBuenas', 'cantarTruco', 'responderTruco', 'escalarTruco',
  ]);

  private esPartidaHistoria(m?: ManoState | null): boolean {
    return (m?.configuracion?.modo ?? (this.rivalNivel !== null || this.heroe !== null ? 1 : 0)) === 1;
  }

  private esperaAccionHumano(m: ManoState): boolean {
    if (m.salpicaduraBloqueando || m.travesuraBloqueando || this.rasgunoBloqueandoEn(m)
      || m.destelloBloqueando || !!m.vistaHabilidadesRival?.destelloBloqueando
      || m.espejismoBloqueando || !!m.vistaHabilidadesRival?.espejismoBloqueando
      || m.mandingaEspejoBloqueando || !!m.vistaHabilidadesRival?.mandingaEspejoBloqueando
      || m.mandingaEnganoBloqueando || !!m.vistaHabilidadesRival?.mandingaEnganoBloqueando
      || m.mandingaMaldicionBloqueando || !!m.vistaHabilidadesRival?.mandingaMaldicionBloqueando) return true;
    if (m.envidoPendienteRespuestaHumano || m.trucoPendienteRespuestaHumano) return true;
    if (m.cartaMaquinaEnMesa) return true;
    if (m.cartaHumanoEnMesa) return false;
    return m.turnoActual === 'Humano';
  }

  private firmaEstadoMaquina(m: ManoState): string {
    return [
      m.turnoActual,
      m.bazas?.length,
      m.cartaMaquinaEnMesa?.numero,
      m.cartaHumanoEnMesa?.numero,
      m.envidoPendienteRespuestaHumano,
      m.trucoPendienteRespuestaHumano,
      m.ganadorMano,
    ].join('|');
  }

  private async correrMaquinas(): Promise<void> {
    if (!this.esPartidaHistoria(this.mano) || this.maquinaCorriendo) return;
    this.maquinaCorriendo = true;
    try {
      let sinProgreso = 0;
      while (this.mano) {
        const m = this.mano;
        if (m.ganadorPartida || m.ganadorMano) break;
        if (this.accionesBloqueadasPorHabilidadRival) {
          if (this.mano?.id === m.id && this.rasgunoBloqueandoEn(m) && this.rasgunoManoId !== m.id) {
            this.manejarRasguno(m);
          }
          if (this.mano?.id === m.id && this.aullidoBloqueandoEn(m) && this.aullidoManoId !== m.id) {
            this.manejarAullido(m);
          }
          break;
        }
        if (this.esperaAccionHumano(m)) break;

        const firmaAntes = this.firmaEstadoMaquina(m);
        this.rivalLabel = 'Pensando...';
        this.cdr.markForCheck();

        await this.delay(this.delayMaquinaMs);

        try {
          const res = await firstValueFrom(
            this.http.post<{ mano: ManoState; evento?: { tipo: string; texto: string } }>(
              `${API}/avanzarMaquina`,
              { manoId: m.id },
            ),
          );
          this.mano = res.mano;
          if (res.evento?.texto) {
            this.bubbleText = res.evento.texto;
          }
          this.updateEventosHabilidad(res.mano);
          this.updateUI(res.mano);
          if (!res.evento) break;

          if (this.firmaEstadoMaquina(res.mano) === firmaAntes) {
            if (++sinProgreso >= 2) break;
          } else {
            sinProgreso = 0;
          }
        } catch {
          this.showToast('Error de conexión al avanzar la máquina.');
          break;
        }
      }
    } finally {
      this.maquinaCorriendo = false;
      this.cdr.markForCheck();
    }
  }

  async call(endpoint: string, body: object): Promise<void> {
    if (this.loading || this.maquinaCorriendo) return;
    if (endpoint !== 'confirmarSalpicadura'
      && endpoint !== 'confirmarTravesura'
      && endpoint !== 'confirmarRasguno'
      && endpoint !== 'confirmarAullido'
      && endpoint !== 'confirmarDestello'
      && endpoint !== 'confirmarEspejismo'
      && endpoint !== 'confirmarMandingaEspejo'
      && endpoint !== 'confirmarMandingaEngano'
      && endpoint !== 'confirmarMandingaMaldicion'
      && endpoint !== 'ganarAutomaticoDebug'
      && endpoint !== 'sumarPuntosHumanoDebug'
      && this.accionesBloqueadasPorHabilidadRival) return;
    this.loading = true;

    const pensar = this.ENDPOINTS_PENSAR.has(endpoint);
    // Tu carta aparece al instante en la mesa; la máquina "piensa" antes de mostrar su jugada.
    if (endpoint === 'jugarCarta') this.colocarCartaHumanoOptimista(body);
    // Tu canto aparece al instante en tu burbuja (la respuesta/tantos los muestra la secuencia).
    this.feedbackCantoHumano(endpoint, body);

    try {
      const data = await firstValueFrom(
        this.http.post<ManoState>(`${API}/${endpoint}`, body)
      );
      // Pausa que simula a la máquina pensando antes de revelar su jugada/respuesta.
      if (pensar) await this.delay(this.delayMaquinaMs);
      this.recibirMano(data);
      await this.correrMaquinas();
    } catch (err: unknown) {
      const msg = this.extraerErrorApi(err);
      this.showToast(`Error en ${endpoint}: ${msg}`);
      if (endpoint === 'nuevaPartida') {
        this.manoInicialRecibida = true;
        this.assetsCombateListos = true;
        this.combateListo = true;
      }
      if (this.mano) this.updateUI(this.mano);
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Coloca la carta que el humano acaba de jugar en la mesa de inmediato (sin esperar
   * al backend), para que su propia jugada no se sienta lenta durante el delay.
   * El estado autoritativo del backend se aplica después y reemplaza esta vista.
   */
  private colocarCartaHumanoOptimista(body: any): void {
    const m = this.mano;
    if (!m) return;

    const idxHand = this.misCarts.findIndex(
      mc => mc.carta?.numero === body?.numero && mc.carta?.palo === body?.palo
    );
    if (idxHand < 0) return;
    const carta = this.misCarts[idxHand].carta;

    this.misCarts = this.misCarts.map((mc, i) => i === idxHand ? { ...mc, visible: false } : mc);

    const slotIdx = m.bazas?.length ?? 0;
    if (carta && slotIdx >= 0 && slotIdx < this.slots.length) {
      this.slots = this.slots.map((s, i) => i === slotIdx ? { ...s, jugador: carta, pending: true } : s);
    }
    this.cdr.markForCheck();
  }

  // Acumula los eventos de habilidad en el log
  private updateEventosHabilidad(m: ManoState): void {
    const lineas: string[] = [];
    const v = m.vistaHabilidadesHumano;

    if (v?.habilidadesActivasEnPartida) {
      if (v.activaDisponible && !v.activaUsadaEnEstaMano)
        lineas.push('⚡ Activa disponible');

      if (v.cartaReveladaRival)
        lineas.push(`👁 Rival revelado: ${v.cartaReveladaRival.numero} de ${v.cartaReveladaRival.palo}`);

      if (v.ultimoMensajeHabilidad)
        lineas.push(`▶ ${this.mensajeHabilidadLimpio(v.ultimoMensajeHabilidad)}`);
    }

    if (lineas.length > 0) {
      this.eventosHabilidad = lineas;
    }
  }

  // ── Jugar carta ───────────────────────────────────────────────────────────
  jugarCarta(i: number): void {
    if (this.loading || this.maquinaCorriendo || this.accionesBloqueadasPorHabilidadRival) return;
    const c = this.misCarts[i]?.carta;
    if (!c || !this.mano) return;

    // Manipulador en modo selección: el jugador ya tocó "Usar habilidad",
    // ahora elige qué carta cambiar → llamar al backend con esa carta
    if (this.modoSeleccionCarta && this.heroe?.id === 0) {
      this.modoSeleccionCarta = false;
      this.misCarts = this.misCarts.map((mc, idx) => ({ ...mc, seleccionada: idx === i }));
      this.cdr.markForCheck();
      const body: Record<string, unknown> = {
        manoId: this.mano.id,
        numeroCarta: c.numero,
        paloCarta: c.palo,
      };
      this.misCarts = this.misCarts.map(mc => ({ ...mc, seleccionada: false }));
      this.call('activarHabilidad', body);
      return;
    }

    // No podés jugar una carta si hay un canto de la máquina sin responder.
    if (this.mano.trucoPendienteRespuestaHumano || this.mano.envidoPendienteRespuestaHumano) {
      this.showToast('No podés jugar: primero respondé el canto.', 'info');
      return;
    }

    // Tampoco si todavía no es tu turno.
    if (this.mano.turnoActual === 'Maquina' && !this.mano.cartaMaquinaEnMesa) {
      this.showToast('Esperá tu turno para jugar.', 'info');
      return;
    }

    // Flujo normal: jugar la carta
    new Audio('/assets/musica/card.mp3').play().catch(() => { });
    this.call('jugarCarta', { manoId: this.mano.id, numero: c.numero, palo: c.palo });
  }

  // ── Usar habilidad ────────────────────────────────────────────────────────
  usarHabilidad(): void {
    if (this.loading || this.maquinaCorriendo || !this.mano || !this.habilidadDisponible
      || this.accionesBloqueadasPorHabilidadRival) return;

    // Manipulador: activar modo selección (si ya está activo, ignorar)
    if (this.heroe?.id === 0) {
      if (this.modoSeleccionCarta) return;
      this.modoSeleccionCarta = true;
      this.cdr.markForCheck();
      return;
    }

    // Resto de héroes: llamar al backend directamente sin elegir carta
    this.call('activarHabilidad', { manoId: this.mano.id });
  }

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
    if (this.nuevaManoTimer) { clearTimeout(this.nuevaManoTimer); this.nuevaManoTimer = null; }
    this.countdown = null;
  }

  nuevaPartida(): void {
    this.gameOver = false;
    this.derrotaFinalMostrando = false;
    this.derrotaFinalTerminada = false;
    if (this.derrotaFinalTimer) { clearTimeout(this.derrotaFinalTimer); this.derrotaFinalTimer = null; }
    this.victoriaHistoriaRegistrada = false;
    this.eventosHabilidad = [];
    this.habilidadCartaIdx = null;
    this.modoSeleccionCarta = false;
    this.salpicaduraManoId = null;
    this.travesuraManoId = null;
    this.rasgunoManoId = null;
    this.prevMensajeRival = null;
    this.salpicaduraCartasOriginales = [];
    this.rasgunoCartasOriginales = [];
    this.cancelarSalpicaduraTimer();
    this.cancelarTravesuraTimer();
    this.cancelarRasgunoTimer();
    this.cancelarDestelloTimer();
    this.cancelarEspejismoTimers();
    this.call('nuevaPartida', this.construirBodyPartida());
  }

  mostrarConfirmSalir = false;

  salirPartida(): void {
    this.mostrarConfirmSalir = true;
  }

  confirmarSalir(): void {
    this.mostrarConfirmSalir = false;
    localStorage.removeItem('practicaEscenario');
    const esHistoria = localStorage.getItem('historiaPartida') === '1';
    const esPulperia = localStorage.getItem('origenPulperia') === '1';
    if (esHistoria) {
      localStorage.removeItem('historiaPartida');
      localStorage.removeItem('rivalNivel');
    }
    localStorage.removeItem('origenPulperia');
    window.dispatchEvent(new CustomEvent('truco-solo:end'));
    // No navegar si es historia (Phaser lo maneja) ni si vino de la pulpería (overlay)
    if (!esHistoria && !esPulperia) {
      this.router.navigate(['/home']);
    }
  }

  cancelarSalir(): void {
    this.mostrarConfirmSalir = false;
  }

  /** victoria mandinga */
  get esVictoriaFinalHistoria(): boolean {
    return this.gameOverWon && this.esMandinga && this.rivalNivel !== null;
  }

  // ── Animación de derrota final del Mandinga (antes de los créditos) ────────
  derrotaFinalMostrando = false;
  derrotaFinalTerminada = false;
  private derrotaFinalTimer: ReturnType<typeof setTimeout> | null = null;

  /** Muestra al Mandinga despidiéndose y recién después arranca los créditos. */
  private iniciarDerrotaFinal(): void {
    if (this.derrotaFinalMostrando || this.derrotaFinalTerminada) return;
    this.derrotaFinalMostrando = true;
    this.derrotaFinalTimer = setTimeout(() => {
      this.derrotaFinalMostrando = false;
      this.derrotaFinalTerminada = true;
      this.cdr.markForCheck();
    }, 5200);
  }

  /** Se ejecuta cuando el jugador termina de ver los créditos finales. */
  finalizarCreditos(): void {
    localStorage.removeItem('historiaPartida');
    localStorage.removeItem('rivalNivel');
    localStorage.removeItem('origenPulperia');
    window.dispatchEvent(new CustomEvent('truco-solo:end'));
    this.router.navigate(['/home']);
  }

  // SOLO PRUEBAS — Forzar victoria a 30 puntos en historia. Eliminar antes de producción.
  ganarAutomaticoDebug(): void {
    if (!this.mano || !this.esPartidaHistoria(this.mano)) return;
    this.cancelarSalpicaduraTimer();
    this.cancelarTravesuraTimer();
    this.cancelarRasgunoTimer();
    this.call('ganarAutomaticoDebug', { manoId: this.mano.id });
  }

  ganar10PuntosDebug(): void {
    if (!this.mano || !this.esMandinga) return;
    this.call('sumarPuntosHumanoDebug', { manoId: this.mano.id });
  }

  private registrarVictoriaHistoria(m: ManoState): void {
    if (this.victoriaHistoriaRegistrada || this.rivalNivel === null) return;
    this.victoriaHistoriaRegistrada = true;

    const diferencia = Math.max(0, m.puntosHumano - m.puntosMaquina);
    this.http.post(`${API_HISTORIA}/registrarVictoria`, {
      rivalNivel: this.rivalNivel,
      diferenciaPuntos: diferencia,
    }).subscribe({
      next: () => window.dispatchEvent(new Event('historia:progreso-actualizado')),
      error: () => {
        this.victoriaHistoriaRegistrada = false;
        this.showToast('No se pudo guardar el progreso de historia.');
      },
    });
  }

  // ── UI update ─────────────────────────────────────────────────────────────
  private updateUI(m: ManoState): void {
    this.redrawTally(m.puntosHumano, m.puntosMaquina);

    const justResolvedEnvido = !!m.envidoResuelto && !this.prevEnvidoResuelto;

    if (m.ganadorPartida) {
      // Si la partida se definió por el envido, primero se ven los tantos (¡Quiero!,
      // los cantos de cada uno) y recién después aparece el overlay de fin de partida.
      if (justResolvedEnvido) {
        this.btns = []; // sin acciones mientras corre la animación de cierre
        this.turnoBadge = '';
        this.reproducirSecuenciaEnvido(m);
        this.prevEnvidoResuelto = true;
        if (this.gameOverTimer) clearTimeout(this.gameOverTimer);
        this.gameOverTimer = setTimeout(() => {
          this.gameOver = true;
          this.gameOverWon = m.ganadorPartida === 'Humano';
          // La partida también puede definirse por el envido: hay que registrar la
          // victoria de historia acá igual que en el cierre normal, si no el progreso
          // (rival derrotado) no se guarda y el siguiente rival queda bloqueado.
          if (this.gameOverWon && this.rivalNivel !== null) {
            this.registrarVictoriaHistoria(m);
          }
          if (this.esVictoriaFinalHistoria) this.iniciarDerrotaFinal();
          this.cdr.markForCheck();
        }, this.duracionSecuenciaEnvido(m) + 800);
        this.cdr.markForCheck();
        return;
      }
      this.gameOver = true;
      this.gameOverWon = m.ganadorPartida === 'Humano';
      if (this.gameOverWon && this.rivalNivel !== null) {
        this.registrarVictoriaHistoria(m);
      }
      if (this.esVictoriaFinalHistoria) this.iniciarDerrotaFinal();
      this.cdr.markForCheck();
      return;
    }
    this.gameOver = false;

    if (m.ganadorMano) {
      this.rivalLabel = m.ganadorMano === 'Humano' ? '¡Perdí la mano!' : '¡Gané la mano!';
      this.habilidadCartaIdx = null;
      this.modoSeleccionCarta = false;
      if (!m.partidaTerminada && m.ganadorMano !== this.prevGanadorMano) {
        this.iniciarCountdown(() => this.solicitarNuevaMano());
      }
    } else {
      this.rivalLabel = m.turnoActual === 'Maquina' ? 'Pensando...' : '...';
      this.cancelarCountdown();
    }
    this.prevGanadorMano = m.ganadorMano ?? null;

    const pendEnv = !!m.envidoPendienteRespuestaHumano;
    const pendTru = !!m.trucoPendienteRespuestaHumano;
    const esMiTurno = (m.turnoActual === 'Humano' || !!m.cartaMaquinaEnMesa)
      && !m.ganadorMano && !m.ganadorPartida && !pendEnv && !pendTru;

    if (this.rasgunoRevelando) {
      this.turnoBadge = 'Rasguño: el Lobizón va a debilitar una carta...';
    } else if (this.aullidoRevelando) {
      this.turnoBadge = 'Aullido: el Lobizón te asusta...';
    } else if (this.travesuraRevelando) {
      this.turnoBadge = 'Travesura: memorizá tus cartas...';
    } else if (this.salpicaduraRevelando) {
      this.turnoBadge = 'Salpicadura: mirá tus cartas originales...';
    } else if (this.destelloRevelando) {
      this.turnoBadge = 'Destello: la Luz Mala te confunde...';
    } else if (this.espejismoRevelando) {
      this.turnoBadge = 'Espejismo: no confíes en lo que ves...';
    } else if (this.mandingaEspejoRevelando) {
      this.turnoBadge = 'El Espejo: copia tu carta más alta...';
    } else if (this.mandingaEnganoRevelando) {
      this.turnoBadge = 'El Engaño: memorizá tus cartas...';
    } else if (this.mandingaMaldicionRevelando) {
      this.turnoBadge = 'El Pacto: la mesa está maldita...';
    } else {
      this.turnoBadge = esMiTurno
        ? 'Tu turno — jugá una carta o cantá'
        : (pendEnv || pendTru) ? 'Respondé el canto de la máquina' : '';
    }

    this.updateBubble(m, pendTru, pendEnv);
    this.prevEstadoTruco = m.estadoTruco ?? '';
    this.prevEstadoEnvido = m.estadoEnvido ?? '';
    this.prevPendTru = pendTru;
    this.prevPendEnv = pendEnv;
    this.prevEnvidoResuelto = !!m.envidoResuelto;

    const cantOp = m.maquina?.mano?.length ?? 0;
    this.actualizarCartasRival(m, cantOp);

    this.manejarSalpicadura(m);
    this.manejarRasguno(m);
    this.manejarTravesura(m);
    this.manejarAullido(m);
    this.manejarDestello(m);
    this.manejarEspejismo(m);
    this.manejarMandingaEspejo(m);
    this.manejarMandingaEngano(m);
    this.manejarMandingaMaldicion(m);

    this.slots = [0, 1, 2].map(i => {
      const b = m.bazas?.[i];
      const idxActual = m.bazas?.length ?? 0;
      const pendingMaq = !b && i === idxActual && !!m.cartaMaquinaEnMesa;
      const pendingHum = !b && i === idxActual && !!m.cartaHumanoEnMesa && !m.cartaMaquinaEnMesa;
      const espejismoOculto = pendingMaq && this.espejismoOcultandoMesa(m);
      const espejismoParpadeoActivo = pendingMaq && this.espejismoAlternandoEnMesa(m);
      return {
        jugador: b?.cartaJugador ?? (pendingHum ? m.cartaHumanoEnMesa : undefined),
        maquina: espejismoOculto
          ? undefined
          : (b?.cartaMaquina ?? (pendingMaq ? this.cartaMaquinaVisual(m) : undefined)),
        pending: pendingMaq,
        espejismoOculto,
        espejismoParpadeo: espejismoParpadeoActivo && this.espejismoParpadeoAnim,
        winner: b?.ganador,
      };
    });

    this.actualizarCartasMano(m);

    this.buildBtns(m, esMiTurno, pendEnv, pendTru);

    if (this.escenarioPractica !== null) {
      this.actualizarTutorial(m);
    }

    this.cdr.markForCheck();
  }

  private cancelarSalpicaduraTimer(): void {
    if (this.salpicaduraTimer) {
      clearTimeout(this.salpicaduraTimer);
      this.salpicaduraTimer = null;
    }
    if (this.salpicaduraInterval) {
      clearInterval(this.salpicaduraInterval);
      this.salpicaduraInterval = null;
    }
    this.salpicaduraRevelando = false;
    this.salpicaduraSegundos = 0;
  }

  private manejarSalpicadura(m: ManoState): void {
    const bloqueando = !!m.vistaHabilidadesRival?.salpicaduraBloqueando;
    if (!bloqueando) {
      if (!this.salpicaduraTimer) {
        this.salpicaduraRevelando = false;
        this.salpicaduraSegundos = 0;
        this.salpicaduraCartasOriginales = [];
      }
      return;
    }

    if (this.salpicaduraManoId === m.id) return;

    if (this.salpicaduraTimer) clearTimeout(this.salpicaduraTimer);
    if (this.salpicaduraInterval) clearInterval(this.salpicaduraInterval);

    this.salpicaduraManoId = m.id;
    this.salpicaduraCartasOriginales = [...(m.humano?.mano ?? [])];
    this.salpicaduraRevelando = true;
    this.salpicaduraSegundos = SALPICADURA_REVEAL_SEG;

    this.salpicaduraInterval = setInterval(() => {
      this.salpicaduraSegundos = Math.max(0, this.salpicaduraSegundos - 1);
      this.cdr.markForCheck();
    }, 1000);

    this.salpicaduraTimer = setTimeout(() => {
      this.salpicaduraTimer = null;
      if (this.salpicaduraInterval) clearInterval(this.salpicaduraInterval);
      this.salpicaduraInterval = null;
      this.salpicaduraRevelando = false;
      this.salpicaduraSegundos = 0;
      this.cdr.markForCheck();
      if (this.mano?.id === m.id) {
        this.confirmarHabilidadRival('confirmarSalpicadura', m.id);
      }
    }, SALPICADURA_REVEAL_SEG * 1000);

    this.cdr.markForCheck();
  }

  private cartaEsOculta(carta: Carta, m: ManoState): boolean {
    if (this.mandingaEnganoRevelando || this.mandingaEnganoBloqueandoEn(m)) {
      return false;
    }
    if (this.mandingaEnganoManoOcultaEn(m)) {
      return true;
    }
    if (this.travesuraRevelando || m.travesuraBloqueando || !!m.vistaHabilidadesRival?.travesuraBloqueando) {
      return false;
    }
    const ocultas = m.cartasOcultasTravesura
      ?? m.vistaHabilidadesRival?.cartasOcultasTravesura
      ?? [];
    return ocultas.some(o => o.numero === carta.numero && o.palo === carta.palo);
  }

  private cancelarTravesuraTimer(): void {
    if (this.travesuraTimer) {
      clearTimeout(this.travesuraTimer);
      this.travesuraTimer = null;
    }
    if (this.travesuraInterval) {
      clearInterval(this.travesuraInterval);
      this.travesuraInterval = null;
    }
    this.travesuraRevelando = false;
    this.travesuraSegundos = 0;
  }

  private manejarTravesura(m: ManoState): void {
    const bloqueando = !!m.vistaHabilidadesRival?.travesuraBloqueando || !!m.travesuraBloqueando;
    if (!bloqueando) {
      if (!this.travesuraTimer) {
        this.travesuraRevelando = false;
        this.travesuraSegundos = 0;
      }
      return;
    }

    if (this.travesuraManoId === m.id) return;

    if (this.travesuraTimer) clearTimeout(this.travesuraTimer);
    if (this.travesuraInterval) clearInterval(this.travesuraInterval);

    this.travesuraManoId = m.id;
    this.travesuraRevelando = true;
    this.travesuraSegundos = TRAVESURA_REVEAL_SEG;

    this.travesuraInterval = setInterval(() => {
      this.travesuraSegundos = Math.max(0, this.travesuraSegundos - 1);
      this.cdr.markForCheck();
    }, 1000);

    this.travesuraTimer = setTimeout(() => {
      this.travesuraTimer = null;
      if (this.travesuraInterval) clearInterval(this.travesuraInterval);
      this.travesuraInterval = null;
      this.travesuraRevelando = false;
      this.travesuraSegundos = 0;
      this.cdr.markForCheck();
      if (this.mano?.id === m.id) {
        this.confirmarHabilidadRival('confirmarTravesura', m.id);
      }
    }, TRAVESURA_REVEAL_SEG * 1000);

    this.cdr.markForCheck();
  }

  private cancelarRasgunoTimer(): void {
    if (this.rasgunoTimer) {
      clearTimeout(this.rasgunoTimer);
      this.rasgunoTimer = null;
    }
    if (this.rasgunoInterval) {
      clearInterval(this.rasgunoInterval);
      this.rasgunoInterval = null;
    }
    this.rasgunoRevelando = false;
    this.rasgunoSegundos = 0;
    this.rasgunoCartasOriginales = [];
    this.rasgunoManoId = null;
  }

  private rasgunoBloqueandoEn(m: ManoState): boolean {
    return !!(
      m.rasgunoBloqueando
      || m.vistaHabilidadesRival?.rasgunoBloqueando
    );
  }

  private manejarRasguno(m: ManoState): void {
    const bloqueando = this.rasgunoBloqueandoEn(m);
    if (!bloqueando) {
      if (!this.rasgunoTimer) {
        this.rasgunoRevelando = false;
        this.rasgunoSegundos = 0;
        this.rasgunoCartasOriginales = [];
        this.rasgunoManoId = null;
      }
      return;
    }

    if (this.rasgunoManoId === m.id) return;

    if (this.rasgunoTimer) clearTimeout(this.rasgunoTimer);
    if (this.rasgunoInterval) clearInterval(this.rasgunoInterval);

    this.rasgunoManoId = m.id;
    this.rasgunoCartasOriginales = [...(m.humano?.mano ?? [])];
    this.rasgunoRevelando = true;
    this.rasgunoSegundos = RASGUNO_REVEAL_SEG;

    this.rasgunoInterval = setInterval(() => {
      this.rasgunoSegundos = Math.max(0, this.rasgunoSegundos - 1);
      this.cdr.markForCheck();
    }, 1000);

    this.rasgunoTimer = setTimeout(() => {
      this.rasgunoTimer = null;
      if (this.rasgunoInterval) clearInterval(this.rasgunoInterval);
      this.rasgunoInterval = null;
      this.rasgunoRevelando = false;
      this.rasgunoSegundos = 0;
      this.rasgunoCartasOriginales = [];
      this.cdr.markForCheck();
      if (this.mano?.id === m.id) {
        this.confirmarHabilidadRival('confirmarRasguno', m.id);
      }
    }, RASGUNO_REVEAL_SEG * 1000);

    this.cdr.detectChanges();
  }

  private aullidoBloqueandoEn(m: ManoState): boolean {
    return !!(
      m.aullidoBloqueando
      || m.vistaHabilidadesRival?.aullidoBloqueando
    );
  }

  private cancelarAullidoTimer(): void {
    if (this.aullidoTimer) {
      clearTimeout(this.aullidoTimer);
      this.aullidoTimer = null;
    }
    if (this.aullidoInterval) {
      clearInterval(this.aullidoInterval);
      this.aullidoInterval = null;
    }
    this.aullidoRevelando = false;
    this.aullidoSegundos = 0;
    this.aullidoManoId = null;
  }

  private manejarAullido(m: ManoState): void {
    const bloqueando = this.aullidoBloqueandoEn(m);
    if (!bloqueando) {
      if (!this.aullidoTimer) {
        this.aullidoRevelando = false;
        this.aullidoSegundos = 0;
        this.aullidoManoId = null;
      }
      return;
    }

    if (this.aullidoManoId === m.id) return;

    if (this.aullidoTimer) clearTimeout(this.aullidoTimer);
    if (this.aullidoInterval) clearInterval(this.aullidoInterval);

    this.aullidoManoId = m.id;
    this.aullidoRevelando = true;
    this.aullidoSegundos = AULLIDO_REVEAL_SEG;

    this.aullidoInterval = setInterval(() => {
      this.aullidoSegundos = Math.max(0, this.aullidoSegundos - 1);
      this.cdr.markForCheck();
    }, 1000);

    this.aullidoTimer = setTimeout(() => {
      this.aullidoTimer = null;
      if (this.aullidoInterval) clearInterval(this.aullidoInterval);
      this.aullidoInterval = null;
      this.aullidoRevelando = false;
      this.aullidoSegundos = 0;
      this.cdr.markForCheck();
      if (this.mano?.id === m.id) {
        this.confirmarHabilidadRival('confirmarAullido', m.id);
      }
    }, AULLIDO_REVEAL_SEG * 1000);

    this.cdr.detectChanges();
  }

  private destelloBloqueandoEn(m: ManoState): boolean {
    return !!(
      m.destelloBloqueando
      || m.vistaHabilidadesRival?.destelloBloqueando
    );
  }

  private cancelarDestelloTimer(): void {
    if (this.destelloTimer) {
      clearTimeout(this.destelloTimer);
      this.destelloTimer = null;
    }
    if (this.destelloInterval) {
      clearInterval(this.destelloInterval);
      this.destelloInterval = null;
    }
    this.destelloRevelando = false;
    this.destelloSegundos = 0;
    this.destelloManoId = null;
    this.destelloTriggerKey = null;
  }

  private manejarDestello(m: ManoState): void {
    const bloqueando = this.destelloBloqueandoEn(m);
    if (!bloqueando) {
      if (!this.destelloTimer) {
        this.destelloRevelando = false;
        this.destelloSegundos = 0;
        this.destelloManoId = null;
        this.destelloTriggerKey = null;
      }
      return;
    }

    const triggerKey = `${m.id}-baza-${m.bazas?.length ?? 0}`;
    if (this.destelloTriggerKey === triggerKey) return;

    if (this.destelloTimer) clearTimeout(this.destelloTimer);
    if (this.destelloInterval) clearInterval(this.destelloInterval);

    this.destelloManoId = m.id;
    this.destelloTriggerKey = triggerKey;
    this.destelloRevelando = true;
    this.destelloSegundos = DESTELLO_REVEAL_SEG;

    this.destelloInterval = setInterval(() => {
      this.destelloSegundos = Math.max(0, this.destelloSegundos - 1);
      this.cdr.markForCheck();
    }, 1000);

    this.destelloTimer = setTimeout(() => {
      this.destelloTimer = null;
      if (this.destelloInterval) clearInterval(this.destelloInterval);
      this.destelloInterval = null;
      this.destelloRevelando = false;
      this.destelloSegundos = 0;
      this.cdr.markForCheck();
      if (this.mano?.id === m.id) {
        this.confirmarHabilidadRival('confirmarDestello', m.id);
      }
    }, DESTELLO_REVEAL_SEG * 1000);

    this.cdr.markForCheck();
  }

  private espejismoBloqueandoEn(m: ManoState): boolean {
    return !!(
      m.espejismoBloqueando
      || m.vistaHabilidadesRival?.espejismoBloqueando
    );
  }

  private espejismoActivoEn(m: ManoState): boolean {
    return !!(
      m.espejismoActivo
      || m.vistaHabilidadesRival?.espejismoActivo
    );
  }

  private espejismoAlternandoEn(m: ManoState): boolean {
    return !!(
      m.espejismoAlternando
      || m.vistaHabilidadesRival?.espejismoAlternando
    );
  }

  /** Carta rival boca abajo mientras dura el cartel de Espejismo (3 s). */
  private espejismoOcultandoMesa(m: ManoState): boolean {
    return this.espejismoActivoEn(m)
      && (this.espejismoBloqueandoEn(m) || this.espejismoRevelando);
  }

  private espejismoAlternandoEnMesa(m: ManoState): boolean {
    return this.espejismoActivoEn(m)
      && this.espejismoAlternandoEn(m)
      && !this.espejismoOcultandoMesa(m);
  }

  private espejismoCartaFalsaDe(m: ManoState): Carta | null {
    const ref = m.espejismoCartaFalsa ?? m.vistaHabilidadesRival?.espejismoCartaFalsa;
    if (!ref) return null;
    return this.normalizarCarta(ref as Carta);
  }

  private cartaMaquinaVisual(m: ManoState): Carta | undefined {
    const real = m.cartaMaquinaEnMesa;
    if (!real) return undefined;
    if (this.espejismoOcultandoMesa(m)) return undefined;
    if (!this.espejismoAlternandoEnMesa(m)) return this.normalizarCarta(real);

    const fake = this.espejismoCartaFalsaDe(m);
    if (!fake) return this.normalizarCarta(real);

    return this.espejismoMostrarFake ? fake : this.normalizarCarta(real);
  }

  private cancelarEspejismoParpadeo(): void {
    if (this.espejismoInterval) {
      clearInterval(this.espejismoInterval);
      this.espejismoInterval = null;
    }
    if (this.espejismoParpadeoTimeout) {
      clearTimeout(this.espejismoParpadeoTimeout);
      this.espejismoParpadeoTimeout = null;
    }
    this.espejismoParpadeoAnim = false;
  }

  private cancelarEspejismoTimers(): void {
    if (this.espejismoTimer) {
      clearTimeout(this.espejismoTimer);
      this.espejismoTimer = null;
    }
    if (this.espejismoCountdownInterval) {
      clearInterval(this.espejismoCountdownInterval);
      this.espejismoCountdownInterval = null;
    }
    this.cancelarEspejismoParpadeo();
    this.espejismoRevelando = false;
    this.espejismoSegundos = 0;
    this.espejismoManoId = null;
    this.espejismoMostrarFake = false;
  }

  private iniciarEspejismoParpadeo(m: ManoState): void {
    if (this.espejismoInterval) return;

    const primero = !!(m.espejismoMostrarFakePrimero ?? m.vistaHabilidadesRival?.espejismoMostrarFakePrimero);
    this.espejismoMostrarFake = primero;

    this.espejismoInterval = setInterval(() => {
      this.espejismoParpadeoAnim = true;
      this.espejismoMostrarFake = !this.espejismoMostrarFake;
      if (this.espejismoParpadeoTimeout) clearTimeout(this.espejismoParpadeoTimeout);
      this.espejismoParpadeoTimeout = setTimeout(() => {
        this.espejismoParpadeoAnim = false;
        this.cdr.markForCheck();
      }, 280);
      if (this.mano) this.actualizarCartaEspejismoEnMesa(this.mano);
      this.cdr.markForCheck();
    }, ESPEJISMO_PARPADEO_MS);
  }

  private actualizarCartaEspejismoEnMesa(m: ManoState): void {
    const idx = m.bazas?.length ?? 0;
    if (!this.slots[idx]?.pending) return;
    const oculto = this.espejismoOcultandoMesa(m);
    this.slots[idx] = {
      ...this.slots[idx],
      espejismoOculto: oculto,
      maquina: oculto ? undefined : this.cartaMaquinaVisual(m),
      espejismoParpadeo: !oculto && this.espejismoParpadeoAnim,
    };
  }

  private manejarEspejismo(m: ManoState): void {
    if (!this.espejismoActivoEn(m)) {
      if (!this.espejismoTimer && !this.espejismoInterval) {
        this.cancelarEspejismoTimers();
      }
      return;
    }

    if (this.espejismoAlternandoEn(m) && !this.espejismoBloqueandoEn(m)) {
      this.iniciarEspejismoParpadeo(m);
    }

    const bloqueando = this.espejismoBloqueandoEn(m);
    if (!bloqueando) return;

    const triggerKey = `${m.id}-espejismo-baza0`;
    if (this.espejismoManoId === triggerKey) return;

    if (this.espejismoTimer) clearTimeout(this.espejismoTimer);
    if (this.espejismoCountdownInterval) clearInterval(this.espejismoCountdownInterval);

    this.espejismoManoId = triggerKey;
    this.espejismoRevelando = true;
    this.espejismoSegundos = ESPEJISMO_REVEAL_SEG;
    this.actualizarCartaEspejismoEnMesa(m);

    this.espejismoCountdownInterval = setInterval(() => {
      this.espejismoSegundos = Math.max(0, this.espejismoSegundos - 1);
      this.cdr.markForCheck();
    }, 1000);

    this.espejismoTimer = setTimeout(() => {
      this.espejismoTimer = null;
      if (this.espejismoCountdownInterval) clearInterval(this.espejismoCountdownInterval);
      this.espejismoCountdownInterval = null;
      this.espejismoRevelando = false;
      this.espejismoSegundos = 0;
      this.cdr.markForCheck();
      if (this.mano?.id === m.id) {
        this.confirmarHabilidadRival('confirmarEspejismo', m.id);
      }
    }, ESPEJISMO_REVEAL_SEG * 1000);

    this.cdr.markForCheck();
  }

  private mandingaEspejoBloqueandoEn(m: ManoState): boolean {
    return !!(m.mandingaEspejoBloqueando || m.vistaHabilidadesRival?.mandingaEspejoBloqueando);
  }

  private mandingaEnganoBloqueandoEn(m: ManoState): boolean {
    return !!(m.mandingaEnganoBloqueando || m.vistaHabilidadesRival?.mandingaEnganoBloqueando);
  }

  private mandingaMaldicionBloqueandoEn(m: ManoState): boolean {
    return !!(m.mandingaMaldicionBloqueando || m.vistaHabilidadesRival?.mandingaMaldicionBloqueando);
  }

  private mandingaEnganoManoOcultaEn(m: ManoState): boolean {
    return !!(m.mandingaEnganoManoOculta || m.vistaHabilidadesRival?.mandingaEnganoManoOculta);
  }

  private cancelarMandingaTimers(): void {
    const cancel = (
      timer: ReturnType<typeof setTimeout> | null,
      interval: ReturnType<typeof setInterval> | null,
    ) => {
      if (timer) clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
    cancel(this.mandingaEspejoTimer, this.mandingaEspejoInterval);
    cancel(this.mandingaEnganoTimer, this.mandingaEnganoInterval);
    cancel(this.mandingaMaldicionTimer, this.mandingaMaldicionInterval);
    this.mandingaEspejoTimer = null;
    this.mandingaEspejoInterval = null;
    this.mandingaEnganoTimer = null;
    this.mandingaEnganoInterval = null;
    this.mandingaMaldicionTimer = null;
    this.mandingaMaldicionInterval = null;
    this.mandingaEspejoRevelando = false;
    this.mandingaEnganoRevelando = false;
    this.mandingaMaldicionRevelando = false;
    this.mandingaEspejoSegundos = 0;
    this.mandingaEnganoSegundos = 0;
    this.mandingaMaldicionSegundos = 0;
    this.mandingaEspejoManoId = null;
    this.mandingaEnganoManoId = null;
    this.mandingaMaldicionManoId = null;
  }

  private manejarMandingaEspejo(m: ManoState): void {
    if (!this.mandingaEspejoBloqueandoEn(m)) {
      if (!this.mandingaEspejoTimer) {
        this.mandingaEspejoRevelando = false;
        this.mandingaEspejoSegundos = 0;
      }
      return;
    }

    const triggerKey = `${m.id}-mandinga-espejo`;
    if (this.mandingaEspejoManoId === triggerKey) return;

    if (this.mandingaEspejoTimer) clearTimeout(this.mandingaEspejoTimer);
    if (this.mandingaEspejoInterval) clearInterval(this.mandingaEspejoInterval);

    this.mandingaEspejoManoId = triggerKey;
    this.mandingaEspejoRevelando = true;
    this.mandingaEspejoSegundos = MANDINGA_ESPEJO_SEG;

    this.mandingaEspejoInterval = setInterval(() => {
      this.mandingaEspejoSegundos = Math.max(0, this.mandingaEspejoSegundos - 1);
      this.cdr.markForCheck();
    }, 1000);

    this.mandingaEspejoTimer = setTimeout(() => {
      this.mandingaEspejoTimer = null;
      if (this.mandingaEspejoInterval) clearInterval(this.mandingaEspejoInterval);
      this.mandingaEspejoInterval = null;
      this.mandingaEspejoRevelando = false;
      this.mandingaEspejoSegundos = 0;
      this.cdr.markForCheck();
      if (this.mano?.id === m.id) {
        this.confirmarHabilidadRival('confirmarMandingaEspejo', m.id);
      }
    }, MANDINGA_ESPEJO_SEG * 1000);

    this.cdr.markForCheck();
  }

  private manejarMandingaEngano(m: ManoState): void {
    if (!this.mandingaEnganoBloqueandoEn(m)) {
      if (!this.mandingaEnganoTimer) {
        this.mandingaEnganoRevelando = false;
        this.mandingaEnganoSegundos = 0;
      }
      return;
    }

    const triggerKey = `${m.id}-mandinga-engano`;
    if (this.mandingaEnganoManoId === triggerKey) return;

    if (this.mandingaEnganoTimer) clearTimeout(this.mandingaEnganoTimer);
    if (this.mandingaEnganoInterval) clearInterval(this.mandingaEnganoInterval);

    this.mandingaEnganoManoId = triggerKey;
    this.mandingaEnganoRevelando = true;
    this.mandingaEnganoSegundos = MANDINGA_ENGANO_SEG;

    this.mandingaEnganoInterval = setInterval(() => {
      this.mandingaEnganoSegundos = Math.max(0, this.mandingaEnganoSegundos - 1);
      this.cdr.markForCheck();
    }, 1000);

    this.mandingaEnganoTimer = setTimeout(() => {
      this.mandingaEnganoTimer = null;
      if (this.mandingaEnganoInterval) clearInterval(this.mandingaEnganoInterval);
      this.mandingaEnganoInterval = null;
      this.mandingaEnganoRevelando = false;
      this.mandingaEnganoSegundos = 0;
      this.cdr.markForCheck();
      if (this.mano?.id === m.id) {
        this.confirmarHabilidadRival('confirmarMandingaEngano', m.id);
      }
    }, MANDINGA_ENGANO_SEG * 1000);

    this.cdr.markForCheck();
  }

  private manejarMandingaMaldicion(m: ManoState): void {
    if (!this.mandingaMaldicionBloqueandoEn(m)) {
      if (!this.mandingaMaldicionTimer) {
        this.mandingaMaldicionRevelando = false;
        this.mandingaMaldicionSegundos = 0;
      }
      return;
    }

    const triggerKey = `${m.id}-mandinga-maldicion`;
    if (this.mandingaMaldicionManoId === triggerKey) return;

    if (this.mandingaMaldicionTimer) clearTimeout(this.mandingaMaldicionTimer);
    if (this.mandingaMaldicionInterval) clearInterval(this.mandingaMaldicionInterval);

    this.mandingaMaldicionManoId = triggerKey;
    this.mandingaMaldicionRevelando = true;
    this.mandingaMaldicionSegundos = MANDINGA_MALDICION_SEG;

    this.mandingaMaldicionInterval = setInterval(() => {
      this.mandingaMaldicionSegundos = Math.max(0, this.mandingaMaldicionSegundos - 1);
      this.cdr.markForCheck();
    }, 1000);

    this.mandingaMaldicionTimer = setTimeout(() => {
      this.mandingaMaldicionTimer = null;
      if (this.mandingaMaldicionInterval) clearInterval(this.mandingaMaldicionInterval);
      this.mandingaMaldicionInterval = null;
      this.mandingaMaldicionRevelando = false;
      this.mandingaMaldicionSegundos = 0;
      this.cdr.markForCheck();
      if (this.mano?.id === m.id) {
        this.confirmarHabilidadRival('confirmarMandingaMaldicion', m.id);
      }
    }, MANDINGA_MALDICION_SEG * 1000);

    this.cdr.markForCheck();
  }

  private confirmarHabilidadRival(
    endpoint: 'confirmarSalpicadura' | 'confirmarTravesura' | 'confirmarRasguno' | 'confirmarAullido' | 'confirmarDestello' | 'confirmarEspejismo' | 'confirmarMandingaEspejo' | 'confirmarMandingaEngano' | 'confirmarMandingaMaldicion',
    manoId: string,
  ): void {
    if (endpoint === 'confirmarRasguno') this.rasgunoConfirmando = true;
    firstValueFrom(
      this.http.post<ManoState>(`${API}/${endpoint}`, { manoId }),
    ).then(data => {
      this.rasgunoManoId = null;
      this.rasgunoConfirmando = false;
      this.aullidoManoId = null;
      this.destelloManoId = null;
      this.destelloTriggerKey = null;
      this.espejismoManoId = null;
      this.mandingaEspejoManoId = null;
      this.mandingaEnganoManoId = null;
      this.mandingaMaldicionManoId = null;
      this.recibirMano(data);
      if (endpoint === 'confirmarEspejismo' && this.mano) {
        this.iniciarEspejismoParpadeo(this.mano);
        this.actualizarCartaEspejismoEnMesa(this.mano);
      }
      return this.correrMaquinas();
    }).catch(err => {
      this.rasgunoManoId = null;
      this.rasgunoConfirmando = false;
      this.showToast(`Error en ${endpoint}: ${this.extraerErrorApi(err)}`);
    }).finally(() => this.cdr.detectChanges());
  }

  private recibirMano(data: ManoState): void {
    const manoCambio = !this.mano || data.id !== this.mano.id;
    if (manoCambio) {
      this.cancelarCountdown();
      if (!this.rasgunoBloqueandoEn(data)) {
        this.cancelarRasgunoTimer();
      }
      if (!this.aullidoBloqueandoEn(data)) {
        this.cancelarAullidoTimer();
      }
      if (!this.destelloBloqueandoEn(data)) {
        this.cancelarDestelloTimer();
      }
      if (!this.espejismoActivoEn(data)) {
        this.cancelarEspejismoTimers();
      }
      if (!this.mandingaEspejoBloqueandoEn(data)
        && !this.mandingaEnganoBloqueandoEn(data)
        && !this.mandingaMaldicionBloqueandoEn(data)) {
        this.cancelarMandingaTimers();
      }
    }
    this.mano = data;
    if (!this.manoInicialRecibida) {
      this.manoInicialRecibida = true;
      this.evaluarCombateListo();
    }
    this.updateEventosHabilidad(data);
    this.updateUI(data);
    if (this.rasgunoBloqueandoEn(data) && this.rasgunoManoId !== data.id) {
      this.manejarRasguno(data);
    }
    if (this.aullidoBloqueandoEn(data) && this.aullidoManoId !== data.id) {
      this.manejarAullido(data);
    }
    if (this.destelloBloqueandoEn(data) && this.destelloTriggerKey !== `${data.id}-baza-${data.bazas?.length ?? 0}`) {
      this.manejarDestello(data);
    }
    if (this.espejismoBloqueandoEn(data) && this.espejismoManoId !== `${data.id}-espejismo-baza0`) {
      this.manejarEspejismo(data);
    }
    if (this.mandingaEspejoBloqueandoEn(data) && this.mandingaEspejoManoId !== `${data.id}-mandinga-espejo`) {
      this.manejarMandingaEspejo(data);
    }
    if (this.mandingaEnganoBloqueandoEn(data) && this.mandingaEnganoManoId !== `${data.id}-mandinga-engano`) {
      this.manejarMandingaEngano(data);
    }
    if (this.mandingaMaldicionBloqueandoEn(data) && this.mandingaMaldicionManoId !== `${data.id}-mandinga-maldicion`) {
      this.manejarMandingaMaldicion(data);
    }
  }

  private actualizarCartasMano(m: ManoState): void {
    const manoVisible = this.cartasParaAbanico(m);
    this.misCarts = [0, 1, 2].map(i => {
      const carta = manoVisible[i] ?? null;
      return {
        carta,
        visible: !!carta,
        seleccionada: this.habilidadCartaIdx === i,
        oculta: !!carta && this.cartaEsOculta(carta, m),
      };
    });
    this.cdr.markForCheck();
  }

  private actualizarCartasRival(m: ManoState, cantOp: number): void {
    const manoRival = m.maquina?.mano ?? [];
    const revelada = m.vistaHabilidadesHumano?.cartaReveladaRival ?? null;
    let indiceRevelada = -1;

    if (revelada) {
      indiceRevelada = manoRival.findIndex(c => this.cartaCoincide(c, revelada));
    }

    this.opCards = [0, 1, 2].map(i => {
      const visible = i < cantOp;
      const esRevelada = visible && i === indiceRevelada && revelada != null;
      return {
        visible,
        revelada: esRevelada,
        carta: esRevelada ? this.cartaDesdeRevelada(revelada!) : null,
      };
    });
  }

  private cartasParaAbanico(m: ManoState): Carta[] {
    if (this.salpicaduraRevelando && this.salpicaduraCartasOriginales.length > 0) {
      return this.salpicaduraCartasOriginales;
    }
    if (this.rasgunoRevelando && this.rasgunoCartasOriginales.length > 0) {
      return this.rasgunoCartasOriginales;
    }
    return this.cartasHumano(m);
  }

  private cartasHumano(m: ManoState): Carta[] {
    const directo = m.humano?.mano;
    if (directo?.length) return directo.map(c => this.normalizarCarta(c));

    const raw = m as unknown as Record<string, unknown>;
    const humano = (raw['humano'] ?? raw['Humano']) as Record<string, unknown> | undefined;
    const mano = (humano?.['mano'] ?? humano?.['Mano']) as Record<string, unknown>[] | undefined;
    return (mano ?? []).map(c => this.normalizarCarta(c));
  }

  private normalizarCarta(c: Carta | Record<string, unknown>): Carta {
    const raw = c as unknown as Record<string, unknown>;
    const numero = Number((c as Carta).numero ?? raw['numero'] ?? raw['Numero'] ?? 0);
    const paloRaw = String((c as Carta).palo ?? raw['palo'] ?? raw['Palo'] ?? '');
    const palos: Palo[] = ['Oro', 'Copa', 'Espada', 'Basto'];
    const palo = palos.find(p => p.toLowerCase() === paloRaw.toLowerCase()) ?? (paloRaw as Palo);
    const valorTruco = Number((c as Carta).valorTruco ?? raw['valorTruco'] ?? raw['ValorTruco'] ?? 0);
    return { numero, palo, valorTruco, valorEnvido: Number(raw['valorEnvido'] ?? raw['ValorEnvido'] ?? 0) };
  }

  private solicitarNuevaMano(): void {
    if (this.nuevaManoEnCurso || !this.mano?.ganadorMano || this.mano.partidaTerminada) return;
    this.nuevaManoEnCurso = true;
    const manoAnteriorId = this.mano.id;
    firstValueFrom(
      this.http.post<ManoState>(`${API}/nuevaMano`, { manoAnteriorId }),
    ).then(data => {
      this.recibirMano(data);
      return this.correrMaquinas();
    }).catch(err => {
      this.showToast(`Error en nueva-mano: ${this.extraerErrorApi(err)}`);
    }).finally(() => {
      this.nuevaManoEnCurso = false;
      this.cdr.markForCheck();
    });
  }

  private extraerErrorApi(err: unknown): string {
    const e = err as { error?: string | { error?: string; message?: string }; message?: string };
    if (typeof e?.error === 'string') return e.error;
    if (e?.error && typeof e.error === 'object') {
      return e.error.error ?? e.error.message ?? '';
    }
    return e?.message ?? String(err);
  }

  // ── Tutorial práctica ──────────────────────────────────────────────────────
  private actualizarTutorial(m: ManoState): void {
    this.cartasBrillan = [false, false, false];
    this.btnsBrillan = new Array(this.btns.length).fill(false);
    this.tutorialMsg = '';

    if (m.ganadorPartida || m.partidaTerminada) return;

    const cartas = m.humano?.mano ?? [];
    const manoTerminada = !!m.ganadorMano;
    const envidoPosible = !m.envidoCantado && !m.trucoResuelto
      && (m.bazas?.length ?? 0) === 0 && !manoTerminada
      && !m.envidoPendienteRespuestaHumano && !m.trucoPendienteRespuestaHumano;

    // 1. Siempre: marcar la carta más fuerte
    if (cartas.length > 0 && !manoTerminada) {
      const maxValor = Math.max(...cartas.map(c => c.valorTruco));
      const idx = cartas.findIndex(c => c.valorTruco === maxValor);
      if (idx >= 0) this.cartasBrillan[idx] = true;
    }

    // 2. Cuando el envido es posible: marcar botones y armar mensaje
    if (envidoPosible && cartas.length > 0) {
      const pts = this.calcularPuntosEnvido(cartas);
      const vasAbajo = (m.puntosHumano ?? 0) < (m.puntosMaquina ?? 0);
      const casiGanas = (m.puntosHumano ?? 0) >= 24;

      if (pts >= 25) {
        const idxEnv = this.btns.findIndex(b => b.label === 'Envido');
        if (idxEnv >= 0) this.btnsBrillan[idxEnv] = true;
        if (pts >= 29) {
          const idxReal = this.btns.findIndex(b => b.label === 'Real Envido');
          if (idxReal >= 0) this.btnsBrillan[idxReal] = true;
        }
        this.tutorialMsg = `¡Tenés ${pts} pts de envido! Es un buen momento para cantarlo.`;
      } else if (casiGanas) {
        const idxFalta = this.btns.findIndex(b => b.label === 'Falta Envido');
        if (idxFalta >= 0) this.btnsBrillan[idxFalta] = true;
        this.tutorialMsg = `Tenés ${pts} pts, pero estás cerca de ganar. Un Falta Envido ganado cierra la partida.`;
      } else if (vasAbajo) {
        const idxFalta = this.btns.findIndex(b => b.label === 'Falta Envido');
        if (idxFalta >= 0) this.btnsBrillan[idxFalta] = true;
        this.tutorialMsg = `Vas perdiendo con ${pts} pts de envido. El Falta Envido puede asustar al rival y ayudarte a remontar.`;
      } else {
        this.tutorialMsg = `Tenés ${pts} pts de envido. No es el mejor momento para cantarlo.`;
      }
    } else if (!manoTerminada && cartas.length > 0) {
      this.tutorialMsg = 'La carta que brilla es tu más fuerte. Guardala para la ronda que más importa.';
    }
  }

  private envidoValorCarta(numero: number): number {
    return numero <= 7 ? numero : 0;
  }

  private calcularPuntosEnvido(cartas: Carta[]): number {
    const grupos: Record<string, number[]> = {};
    for (const c of cartas) {
      if (!grupos[c.palo]) grupos[c.palo] = [];
      grupos[c.palo].push(this.envidoValorCarta(c.numero));
    }
    let max = 0;
    for (const vals of Object.values(grupos)) {
      const sorted = [...vals].sort((a, b) => b - a);
      const pts = sorted.length >= 2 ? sorted[0] + sorted[1] + 20 : sorted[0];
      if (pts > max) max = pts;
    }
    return max;
  }

  // ── Burbuja ───────────────────────────────────────────────────────────────
  private updateBubble(m: ManoState, pendTru: boolean, pendEnv: boolean): void {
    const trucoChanged = (m.estadoTruco ?? '') !== this.prevEstadoTruco;
    const justResolvedEnvido = !!m.envidoResuelto && !this.prevEnvidoResuelto;

    // El envido recién se resolvió → reproducir la secuencia de tantos (máquina/humano),
    // como en 2v2/3v3. Si además quedó un truco pendiente, se muestra al final.
    if (justResolvedEnvido) {
      this.reproducirSecuenciaEnvido(m);
      if (pendTru) {
        const txt = this.cantoBubbleText(m, true, false);
        const t = setTimeout(() => { if (txt) this.showBubble(txt); }, this.duracionSecuenciaEnvido(m));
        this.envidoSeqTimers.push(t);
      }
      return;
    }

    if (pendTru || pendEnv) {
      if (this.bubbleTimer) { clearTimeout(this.bubbleTimer); this.bubbleTimer = null; }
      const txt = this.cantoBubbleText(m, pendTru, pendEnv);
      if (txt) this.showBubble(txt);
    } else {
      // Acá solo manejamos la respuesta al TRUCO; el envido lo cubre la secuencia.
      let resp = '';
      if (trucoChanged && m.trucoCantado && !this.prevPendTru) {
        const t = (m.estadoTruco ?? '').toLowerCase();
        resp = (t.includes('no quiso') || t.includes('no quiere'))
          ? '¡No quiero!'
          : (t.includes('quiso') || t.includes('quiere') || t.includes('acepto'))
            ? '¡Quiero!' : '';
      }
      if (resp) {
        this.showTempBubble(resp, 2500);
      } else if (!this.bubbleTimer && this.envidoSeqTimers.length === 0) {
        this.bubbleText = '';
      }
    }
  }

  /**
   * Reproduce el intercambio del envido como una secuencia de diálogos (¡Quiero!,
   * los tantos en orden de mano, o "Son buenas"), espejo de 2v2/3v3. En 1v1 el
   * backend resuelve todo de una, así que reconstruimos la secuencia desde el estado.
   */
  private reproducirSecuenciaEnvido(m: ManoState): void {
    this.limpiarEnvidoSeq();

    const estado = (m.estadoEnvido ?? '').toLowerCase();
    const humanoCanto = m.cantorEnvido === 'Humano';
    const maquinaCanto = m.cantorEnvido === 'Maquina';
    const noQuiso = estado.includes('no quis') || estado.includes('no quier');

    const steps: { lado: 'maquina' | 'humano'; texto: string }[] = [];

    if (m.sonBuenasDeclarado) {
      // El humano reconoció el envido de la máquina sin mostrar cartas.
      steps.push({ lado: 'humano', texto: '¡Son buenas!' });
    } else if (noQuiso) {
      // Quien rechazó: si cantó el humano, rechazó la máquina; si cantó la máquina, el humano.
      steps.push({ lado: humanoCanto ? 'maquina' : 'humano', texto: '¡No quiero!' });
    } else if (m.tantoHumano != null && m.tantoCantadoMaquina != null) {
      // Hubo "quiero": primero la aceptación, después los tantos en orden de mano.
      if (humanoCanto) steps.push({ lado: 'maquina', texto: '¡Quiero!' });
      else if (maquinaCanto) steps.push({ lado: 'humano', texto: '¡Quiero!' });

      const decls: { lado: 'maquina' | 'humano'; texto: string }[] = [
        { lado: 'humano', texto: `Tengo ${m.tantoHumano}` },
        { lado: 'maquina', texto: `Tengo ${m.tantoCantadoMaquina}` },
      ];
      // El "mano" declara primero.
      if (m.manoIniciadaPor === 'Maquina') decls.reverse();
      steps.push(...decls);
    }

    const paso = this.pasoEnvidoMs;
    let acc = 300; // pequeño respiro antes del primer diálogo
    for (const s of steps) {
      const at = acc;
      const t = setTimeout(() => {
        if (s.lado === 'maquina') this.showTempBubble(s.texto, paso + 600);
        else this.showTempBubbleHumano(s.texto, paso + 600);
      }, at);
      this.envidoSeqTimers.push(t);
      acc += paso;
    }
    // Marcar el fin de la secuencia para liberar el guard de limpieza de burbuja.
    this.envidoSeqTimers.push(setTimeout(() => { this.envidoSeqTimers = []; }, acc + 700));
  }

  /** Ritmo entre diálogos del envido: sigue al delay de juego pero acotado (0.9–1.4s). */
  private get pasoEnvidoMs(): number {
    return Math.min(1400, Math.max(900, this.delayMaquinaMs));
  }

  /** Duración estimada de la secuencia de envido (para encadenar el truco después). */
  private duracionSecuenciaEnvido(m: ManoState): number {
    let n = 0;
    const estado = (m.estadoEnvido ?? '').toLowerCase();
    if (m.sonBuenasDeclarado) n = 1;
    else if (estado.includes('no quis') || estado.includes('no quier')) n = 1;
    else if (m.tantoHumano != null && m.tantoCantadoMaquina != null) n = 3;
    return 300 + n * this.pasoEnvidoMs + 200;
  }

  private limpiarEnvidoSeq(): void {
    this.envidoSeqTimers.forEach(t => clearTimeout(t));
    this.envidoSeqTimers = [];
  }

  /** Muestra el canto del humano en su burbuja apenas lo hace (envido/truco). */
  private feedbackCantoHumano(endpoint: string, body: any): void {
    let txt = '';
    if (endpoint === 'cantarEnvido' || endpoint === 'cantarEnvidoTipo')
      txt = '¡' + (body?.tipo ?? 'Envido') + '!';
    else if (endpoint === 'cantarTruco') txt = '¡Truco!';
    else if (endpoint === 'escalarTruco') txt = '¡Quiero más!';
    if (txt) this.showTempBubbleHumano(txt, 1800);
  }

  private cantoBubbleText(m: ManoState, pendTru: boolean, pendEnv: boolean): string {
    if (pendTru) {
      if (m.nivelTruco === 2) return '¡Retruco!';
      if (m.nivelTruco === 3) return '¡Vale Cuatro!';
      return '¡Truco!';
    }
    if (pendEnv) {
      const s = (m.estadoEnvido ?? '').toLowerCase();
      if (s.includes('falta')) return '¡Falta Envido!';
      if (s.includes('real')) return '¡Real Envido!';
      return '¡Envido!';
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
      this.bubbleText = '';
      this.bubbleTimer = null;
      this.cdr.markForCheck();
    }, ms);
  }

  /** Burbuja del lado del jugador (para sus declaraciones de tanto / "son buenas"). */
  private showTempBubbleHumano(txt: string, ms: number): void {
    if (this.bubbleHumanoTimer) { clearTimeout(this.bubbleHumanoTimer); this.bubbleHumanoTimer = null; }
    this.bubbleHumanoText = txt;
    this.cdr.markForCheck();
    this.bubbleHumanoTimer = setTimeout(() => {
      this.bubbleHumanoText = '';
      this.bubbleHumanoTimer = null;
      this.cdr.markForCheck();
    }, ms);
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  private showToast(msg: string, tipo: 'error' | 'info' = 'error'): void {
    if (this.toastTimer) { clearTimeout(this.toastTimer); this.toastTimer = null; }
    this.toastMsg = msg;
    this.toastTipo = tipo;
    this.cdr.markForCheck();
    this.toastTimer = setTimeout(() => {
      this.toastMsg = '';
      this.toastTimer = null;
      this.cdr.markForCheck();
    }, tipo === 'info' ? 2600 : 4000);
  }

  // ── Botones ───────────────────────────────────────────────────────────────
  private buildBtns(
    m: ManoState, esMiTurno: boolean, pendEnv: boolean, pendTru: boolean
  ): void {
    const manoEnd = !!m.ganadorMano || !!m.ganadorPartida;
    const trucoCantado = !!m.trucoCantado;
    const trucoResuelto = !!m.trucoResuelto;
    const raw: [string, string, (() => void) | null][] = [];

    if (m.partidaTerminada) {
      raw.push(['Nueva partida', '#226622', () => this.nuevaPartida()]);

    } else if (m.ganadorMano) {
      raw.push(['Nueva mano', '#cc8800', () => {
        this.cancelarCountdown();
        this.solicitarNuevaMano();
      }]);

    } else if (pendEnv) {
      raw.push(['QUIERO', '#44ff44',
        () => this.call('responderEnvido', { manoId: m.id, aceptar: true })]);
      const tipoEnv = m.tipoEnvidoCantado;
      if (tipoEnv === 'Envido')
        raw.push(['ENVIDO', '#ffdd00',
          () => this.call('responderEnvido', { manoId: m.id, aceptar: true, escalarA: 'Envido Envido' })]);
      if (tipoEnv === 'Envido' || tipoEnv === 'EnvidoEnvido')
        raw.push(['REAL ENVIDO', '#ffaa00',
          () => this.call('responderEnvido', { manoId: m.id, aceptar: true, escalarA: 'Real Envido' })]);
      // El backend normaliza el tipo como 'FaltaEnvido' (sin espacio): comparar contra
      // ambos, si no el botón aparecía aunque la máquina ya hubiera cantado la falta.
      if (tipoEnv !== 'FaltaEnvido' && tipoEnv !== 'Falta Envido')
        raw.push(['FALTA ENVIDO', '#ff8800',
          () => this.call('responderEnvido', { manoId: m.id, aceptar: true, escalarA: 'Falta Envido' })]);
      raw.push(['NO QUIERO', '#ff4444',
        () => this.call('responderEnvido', { manoId: m.id, aceptar: false })]);

    } else if (pendTru) {
      raw.push(['QUIERO', '#44ff44',
        () => this.call('responderTruco', { manoId: m.id, aceptar: true })]);
      if ((m.nivelTruco ?? 0) < 3) {
        const lbl = m.nivelTruco === 1 ? 'RETRUCO' : 'VALE 4';
        const esc = m.nivelTruco === 1 ? 'retruco' : 'valecuatro';
        raw.push([lbl, '#ffaa00',
          () => this.call('responderTruco', { manoId: m.id, aceptar: true, escalarA: esc })]);
      }
      raw.push(['NO QUIERO', '#ff4444',
        () => this.call('responderTruco', { manoId: m.id, aceptar: false })]);
      if (!m.envidoCantado && (m.bazas?.length ?? 0) === 0) {
        raw.push(['Envido', '#4488ff', () => this.call('cantarEnvidoTipo', { manoId: m.id, tipo: 'Envido' })]);
        raw.push(['Real Envido', '#4488ff', () => this.call('cantarEnvidoTipo', { manoId: m.id, tipo: 'Real Envido' })]);
        raw.push(['Falta Envido', '#4488ff', () => this.call('cantarEnvidoTipo', { manoId: m.id, tipo: 'Falta Envido' })]);
      }

    } else {
      const envidoPosible = !m.envidoCantado && !m.trucoResuelto
        && (m.bazas?.length ?? 0) === 0 && !manoEnd;
      if (envidoPosible) {
        raw.push(['Envido', '#4488ff', esMiTurno ? () => this.call('cantarEnvidoTipo', { manoId: m.id, tipo: 'Envido' }) : null]);
        raw.push(['Real Envido', '#4488ff', esMiTurno ? () => this.call('cantarEnvidoTipo', { manoId: m.id, tipo: 'Real Envido' }) : null]);
        raw.push(['Falta Envido', '#4488ff', esMiTurno ? () => this.call('cantarEnvidoTipo', { manoId: m.id, tipo: 'Falta Envido' }) : null]);
      }

      if (!trucoCantado) {
        raw.push(['Truco', '#cc4444',
          esMiTurno && !manoEnd ? () => this.call('cantarTruco', { manoId: m.id }) : null]);
      } else if (trucoCantado && !trucoResuelto && (m.nivelTruco ?? 0) < 3 && m.cantorTruco !== 'Humano') {
        const lbl = m.nivelTruco === 1 ? 'Retruco' : 'Vale Cuatro';
        raw.push([lbl, '#cc4444',
          esMiTurno && !manoEnd ? () => this.call('escalarTruco', { manoId: m.id }) : null]);
      }

      if (esMiTurno && !manoEnd)
        raw.push(['Ir al mazo', '#556677', () => this.call('irseAlMazo', { manoId: m.id })]);
    }

    const bloqueado = this.accionesBloqueadasPorHabilidadRival;
    this.btns = raw.map(([label, color, action]) => ({
      label, color, action,
      enabled: !!action && !bloqueado,
    }));
  }

  // ── Tanteador SVG ─────────────────────────────────────────────────────────
  private redrawTally(ptsVos: number, ptsMaq: number): void {
    const sticks: typeof this.tallySticks = [];
    this.drawPalitos(sticks, 36, Math.min(ptsVos, 15), false, 4);
    this.drawPalitos(sticks, 124, Math.min(ptsMaq, 15), true, 4);
    // Buenas (puntos > 15)
    if (ptsVos > 15) this.drawPalitos(sticks, 36, ptsVos - 15, false, 58);
    if (ptsMaq > 15) this.drawPalitos(sticks, 124, ptsMaq - 15, true, 58);
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
        const by = yTop;
        this.stick(out, bx, by + BS, bx, by, color);
        this.stick(out, bx, by, bx + BS, by, color);
        this.stick(out, bx + BS, by, bx + BS, by + BS, color);
        this.stick(out, bx + BS, by + BS, bx, by + BS, color);
        this.stick(out, bx, by + BS, bx + BS, by, color);
        bx += BS + BGAP;
      }
    }
    if (rem > 0) {
      const totalW = rem * SL + (rem - 1) * SGAP;
      let sx = cx - totalW / 2;
      const sy = full > 0 ? yTop + BS + 4 : yTop + 4;
      for (let i = 0; i < rem; i++) {
        this.stick(out, sx, sy + SL, sx + SL, sy, color);
        sx += SL + SGAP;
      }
    }
  }

  private stick(out: typeof this.tallySticks, x1: number, y1: number, x2: number, y2: number, color: string): void {
    out.push({ x1, y1, x2, y2, color });
  }
}