import JugadorPrincipal from '../personajes/JugadorPrincipal.js';
import BaseScene from './BaseScene.js';
import PuntoInteraccion from '../objetos/PuntoInteraccion.js';
import MesaManager from '../objetos/mesaManager.js';

export default class SalaMultijugadorScene extends BaseScene {
  constructor() {
    super('SalaMultijugador');
    this.timerBuscarSalas = null;
    this.mesaManager = null;
    this.estabaMoviendose = false;
  }

  init(data) {
    this.playerKey = data.playerSprite || 'personaje1';
    this.startX = data.x || 880;
    this.startY = data.y || 500;
  }

  async create() {
    this.botonPantallaCompleta();
    this.crearControlesMobile();
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // Tilemap (reutiliza los assets de la pulpería, con toda su decoración)
    const map = this.make.tilemap({ key: 'mapaPulperia' });
    const barraTileSet = map.addTilesetImage('BarPulperia', 'BarPulperia');
    const paredesTileSet = map.addTilesetImage('Paredes', 'ParedesPulperia');
    const pisoTileSet = map.addTilesetImage('Piso', 'PisoPulperia');
    const rackTileSet = map.addTilesetImage('RackPulperia', 'RackPulperia');
    const perchaTileSet = map.addTilesetImage('percha', 'percha');
    const alfombraTileSet = map.addTilesetImage('alfombra', 'alfombra');
    const mesaTileset = map.addTilesetImage('mesa', 'mesa');
    const chinitaTileset = map.addTilesetImage('chinita', 'nenaSentada');
    const gaucho1Tileset = map.addTilesetImage('gaucho', 'gaucho');
    const gaucho2Tileset = map.addTilesetImage('gaucho2', 'gaucho2');
    const gaucho3Tileset = map.addTilesetImage('gaucho3', 'gaucho3');
    const silla1Tileset = map.addTilesetImage('silla1', 'silla1');
    const silla2Tileset = map.addTilesetImage('silla2', 'silla2');
    const lenaTileset = map.addTilesetImage('lena', 'lena');
    const objetosMesa1Tileset = map.addTilesetImage('ObjetosMesa', 'ObjetosMesa');
    const objetosMesa2Tileset = map.addTilesetImage('ObjetosMesa2', 'ObjetosMesa2');

    map.createLayer('Base', pisoTileSet);
    map.createLayer('Paredes', [paredesTileSet, alfombraTileSet]);
    map.createLayer('Estantes', [rackTileSet, pisoTileSet]);
    const objetos2Layer = map.createLayer('Objetos2', [mesaTileset, lenaTileset]);
    const personajesLayer = map.createLayer('Personajes', [
      gaucho1Tileset,
      gaucho2Tileset,
      gaucho3Tileset,
      chinitaTileset,
    ]);
    map.createLayer('Objetos1', [
      mesaTileset,
      perchaTileSet,
      silla1Tileset,
      silla2Tileset,
      alfombraTileSet,
    ]);
    const objetosMesaLayer = map.createLayer('Objetos3', [
      objetosMesa1Tileset,
      objetosMesa2Tileset,
    ]);
    const barraLayer = map.createLayer('Barra', [barraTileSet]);
    const marcoLayer = map.createLayer('Marco', paredesTileSet);
    const colisionesLayer = map.createLayer('Colisiones', paredesTileSet);
    colisionesLayer.setCollisionByExclusion([-1]);

    objetosMesaLayer.setDepth(2);
    objetos2Layer.setDepth(2);
    personajesLayer.setDepth(1);
    barraLayer.setDepth(2);
    marcoLayer.setDepth(3);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Jugador
    this.JugadorPrincipal = new JugadorPrincipal(
      this,
      this.startX,
      this.startY,
      this.playerKey,
    ).setDepth(3);
    this.JugadorPrincipal.setCollideWorldBounds(true);
    this.physics.add.collider(this.JugadorPrincipal, colisionesLayer);
    this.cameras.main.startFollow(this.JugadorPrincipal, true, 0.1, 0.1);
    this.JugadorPrincipal.setScale(1.8);

    // Controles
    this.keys = this.input.keyboard.createCursorKeys();
    this.teclaE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.teclaEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Título de la sala (fijo en pantalla)
    this.add
      .text(640, 30, 'SALA MULTIJUGADOR', {
        fontFamily: 'Jersey 20',
        fontSize: '28px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10);

    // Animaciones de mesas estilo pulpería (pueden existir si ya se visitó la pulpería)
    if (!this.anims.exists('MesaEspera_idle')) {
      this.anims.create({
        key: 'MesaEspera_idle',
        frames: this.anims.generateFrameNumbers('MesaEspera', { start: 0, end: 26 }),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!this.anims.exists('MesaEjemplo2_idle')) {
      this.anims.create({
        key: 'MesaEjemplo2_idle',
        frames: this.anims.generateFrameNumbers('MesaEjemplo2', { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      });
    }

    // 3 mesas: una por modo (misma mesa que usa la pulpería)
    const configMesas = [
      { x: 750,  y: 350, gameMode: '1v1', label: '1 VS 1', jugadores: 1 },
      { x: 1050, y: 350, gameMode: '2v2', label: '2 VS 2', jugadores: 2 },
      { x: 1350, y: 350, gameMode: '3v3', label: '3 VS 3', jugadores: 3 },
    ];

    // geometría del sprite MesaEspera (256x160, origen al centro)
    const SILLA_DX = 99;  // distancia horizontal de las sillas al centro de la mesa
    const SILLA_DY = 24;  // altura de la silla que ya trae el sprite
    const SILLA_SEP = 46; // separación vertical entre sillas del mismo lado

    configMesas.forEach(({ x, y, label, jugadores }) => {
      // Cartelito del modo (mismo estilo que los carteles de la pulpería)
      this.add
        .text(x, y - 102, label, {
          fontFamily: '"Jersey 10"',
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: '#573a04',
          padding: { x: 8, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(5);

      // Pava, mate y cartas quietas sobre la mesa (mismos objetos de la pulpería)
      this.add.image(x, y + 6, 'ObjetosMesa').setDepth(1);

      // Sillas extra: n por lado (el sprite ya trae 1 de cada lado)
      const offsetsExtra =
        jugadores === 3
          ? [SILLA_DY - SILLA_SEP, SILLA_DY + SILLA_SEP]
          : jugadores === 2
            ? [SILLA_DY - SILLA_SEP]
            : [];
      offsetsExtra.forEach((dy) => {
        this.add.image(x - SILLA_DX, y + dy, 'silla1').setFlipX(true).setDepth(0);
        this.add.image(x + SILLA_DX, y + dy, 'silla1').setDepth(0);
      });
    });

    this.puntosDeInteraccion = configMesas.map(({ x, y, gameMode }) =>
      new PuntoInteraccion(this, x, y, 'multijugador', 'MesaEspera', 1, {
        gameMode,
        subVista: 'tradicional',
      }),
    );

    // Portal de salida
    this._crearPortal(460, 430);

    // Texto de ayuda fijo (no sigue la cámara)
    this.add
      .text(10, 690, '[ ESC ] Volver al menú', {
        fontFamily: 'Jersey 20',
        fontSize: '16px',
        color: '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setScrollFactor(0)
      .setDepth(10);

    // MesaManager para salas públicas dinámicas
    // Los anclajes hacen que cada sala pública aparezca debajo de su mesa fija
    const anclajesPorModo = {
      '1v1': { x: 750,  y: 350 },
      '2v2': { x: 1050, y: 350 },
      '3v3': { x: 1350, y: 350 },
    };
    const salaService = this.game.registry.get('salaService');
    const uiService = this.game.registry.get('uiService');
    this.mesaManager = new MesaManager(this, this.JugadorPrincipal, salaService, uiService, anclajesPorModo);

    if (salaService) {
      try {
        await salaService.conectar();
        await this.mesaManager.actualizarMesas();
        this.timerBuscarSalas = this.time.addEvent({
          delay: 3000,
          callback: this.mesaManager.actualizarMesas,
          callbackScope: this.mesaManager,
          loop: true,
        });
      } catch (e) {
        console.error('Error al conectar SalaService en SalaMultijugador:', e);
      }
    }

    window.addEventListener('resume-game', this._onResumeGame);
  }

  _onResumeGame = () => {
    if (this.physics && this.physics.world) {
      this.physics.world.resume();
    }
    // Refresca la lista de salas públicas al cerrar el overlay
    if (this.mesaManager) {
      this.mesaManager.actualizarMesas().catch(() => {});
    }
  };

  update() {
    if (!this.JugadorPrincipal || !this.JugadorPrincipal.body) return;

    // ESC: salir al menú Angular
    if (Phaser.Input.Keyboard.JustDown(this.teclaEsc)) {
      this._salirAlMenu();
      return;
    }

    this.JugadorPrincipal.update(this.keys, this.teclaE);
    const interactuoMobile = this.botonInteractuarPresionado;

    // Portal: mostrar tooltip y detectar interacción
    if (this._portalZona) {
      const dx = this.JugadorPrincipal.x - this._portalZona.x;
      const dy = this.JugadorPrincipal.y - this._portalZona.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const cerca = dist < 90;

      if (this._portalTooltip) this._portalTooltip.setVisible(cerca);

      if (cerca && (Phaser.Input.Keyboard.JustDown(this.teclaE) || interactuoMobile)) {
        this._salirAlMenu();
        return;
      }
    }

    const seMueve =
      this.JugadorPrincipal.body.velocity.x !== 0 ||
      this.JugadorPrincipal.body.velocity.y !== 0;
    if (seMueve) {
      this.estabaMoviendose = true;
    } else if (this.estabaMoviendose) {
      this.estabaMoviendose = false;
    }

    this.puntosDeInteraccion.forEach((punto) => {
      punto.update(this.JugadorPrincipal, this.teclaE, interactuoMobile);
    });

    // Partículas del portal orbitando
    if (this._portalParticulas && this._portalZona) {
      this._portalAngle = (this._portalAngle || 0) + 0.035;
      const { x, y } = this._portalZona;
      this._portalParticulas.forEach(({ dot, fase }) => {
        const angle = this._portalAngle + fase;
        const r = 34;
        dot.setPosition(x + Math.cos(angle) * r, y + Math.sin(angle) * r * 0.45);
      });
    }

    this.botonInteractuarPresionado = false;
  }

  _salirAlMenu() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(420, () => {
      window.dispatchEvent(new CustomEvent('multi-room:exit'));
    });
  }

  /**
   * Crea un portal animado en (x, y) que al interactuar sale al menú.
   */
  _crearPortal(x, y) {
    // ── Suelo del portal (óvalo oscuro) ──────────────────────────
    const sombra = this.add.ellipse(x, y + 36, 80, 20, 0x000000, 0.35).setDepth(1);

    // ── Glow exterior (anillo animado) ────────────────────────────
    const glowOuter = this.add.graphics().setDepth(2);
    const glowInner = this.add.graphics().setDepth(2);
    const core      = this.add.graphics().setDepth(2);

    const drawPortal = (alpha) => {
      glowOuter.clear();
      glowOuter.lineStyle(6, 0x4400cc, alpha * 0.4);
      glowOuter.strokeCircle(x, y, 44);
      glowOuter.lineStyle(4, 0x6622ff, alpha * 0.55);
      glowOuter.strokeCircle(x, y, 38);

      glowInner.clear();
      glowInner.lineStyle(5, 0x9944ff, alpha * 0.75);
      glowInner.strokeCircle(x, y, 30);
      glowInner.lineStyle(3, 0xcc88ff, alpha * 0.9);
      glowInner.strokeCircle(x, y, 22);

      core.clear();
      core.fillStyle(0x220055, alpha * 0.85);
      core.fillCircle(x, y, 18);
      core.fillStyle(0x6600cc, alpha * 0.5);
      core.fillCircle(x, y, 12);
      core.fillStyle(0xccaaff, alpha * 0.3);
      core.fillCircle(x, y, 6);
    };

    drawPortal(1);

    // Pulso de brillo
    this.tweens.add({
      targets: { v: 1 },
      v: 0.55,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: (tween, target) => drawPortal(target.v),
    });

    // Partículas que orbitan (usando círculos gráficos pequeños)
    this._portalParticulas = [];
    const N = 6;
    for (let i = 0; i < N; i++) {
      const dot = this.add.graphics().setDepth(3);
      dot.fillStyle(0xddbbff, 1);
      dot.fillCircle(0, 0, 3);
      this._portalParticulas.push({ dot, fase: (i / N) * Math.PI * 2 });
    }

    // ── Label "SALIDA" ────────────────────────────────────────────
    this.add
      .text(x, y - 60, 'SALIDA', {
        fontFamily: 'Jersey 20',
        fontSize: '18px',
        color: '#cc99ff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(5);

    // ── Tooltip (oculto hasta que el jugador se acerque) ──────────
    this._portalTooltip = this.add
      .text(x, y - 78, '[ E ] Salir al menú', {
        fontFamily: 'Jersey 20',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#00000099',
        stroke: '#000000',
        strokeThickness: 2,
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(5)
      .setVisible(false);

    // Animación de las partículas en el update
    this._portalZona = { x, y };
    this._portalAngle = 0;
  }

  shutdown() {
    if (this.timerBuscarSalas) this.timerBuscarSalas.destroy();
    if (this.mesaManager) this.mesaManager.destroy();
    window.removeEventListener('resume-game', this._onResumeGame);
  }
}
