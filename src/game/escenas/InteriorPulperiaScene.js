import JugadorPrincipal from '../personajes/JugadorPrincipal.js';
import BaseScene from './BaseScene.js';
import Npc from '../personajes/Npc.js';
import Tutorial from '../objetos/Tutorial.js';
import Portal from '../objetos/Portal.js';
import PuntoInteraccion from '../objetos/PuntoInteraccion.js';
import MesaManager from '../objetos/mesaManager.js';
import { TUTORIALES } from '../data/tutoriales.js';
import GauchosPulperia from '../personajes/GauchosPulperia.js';

export default class InteriorPulperiaScene extends BaseScene {
  constructor() {
    super('InteriorPulperiaScene');
    this.timerBuscarSalas = null;
    this.mesaManager = null;
    this.mesasDecoracion = null;
  }

  init(data) {
    this.playerKey = data.playerSprite || 'player';
    this.startX = data.x || 85;
    this.startY = data.y || 470;
  }

  preload() {
    this.load.audio('pasos', './assets/musica/sonidos/paso.ogg');
    this.load.image('mesa_juego', './assets/objetos/mesa.png');
    this.load.image('nenaSentada', './assets/mapa-pulperia/nenaSentada.png');
    this.load.image('gaucho', './assets/mapa-pulperia/gauchosentado.png');
    this.load.image('gaucho2', './assets/mapa-pulperia/gauchosentado2.png');
    this.load.image('gaucho3', './assets/mapa-pulperia/gauchosentado3.png');
    this.load.image('ObjetosMesa', './assets/mapa-pulperia/mesa_objetos.png');
    this.load.image('ObjetosMesa2', './assets/mapa-pulperia/mesa_objetos_2.png');
    this.load.spritesheet('MesaEjemplo', './assets/sprites/GauchoEjemplo.png', {
      frameWidth: 256,
      frameHeight: 160,
    });
    this.load.spritesheet('MesaSolitario', './assets/sprites/GauchoSolitario.png', {
      frameWidth: 256,
      frameHeight: 160,
    });
    this.load.spritesheet('MesaEjemplo2', './assets/sprites/GauchoEjemplo2.png', {
      frameWidth: 256,
      frameHeight: 160,
    });
    this.load.spritesheet('MesaEjemplo3', './assets/sprites/GauchoEjemplo3.png', {
      frameWidth: 256,
      frameHeight: 160,
    });
    this.load.spritesheet('MesaEjemplo4', './assets/sprites/GauchoEjemplo4.png', {
      frameWidth: 256,
      frameHeight: 160,
    });
    this.load.spritesheet('MesaEjemplo5', './assets/sprites/GauchoEjemplo5.png', {
      frameWidth: 256,
      frameHeight: 160,
    });
    this.load.spritesheet('MesaEjemplo6', './assets/sprites/GauchoEjemplo6.png', {
      frameWidth: 256,
      frameHeight: 160,
    });
    this.load.spritesheet('MesaEspera', './assets/sprites/MesaEspera.png', {
      frameWidth: 256,
      frameHeight: 160,
    });
  }

  async create() {
    this.botonPantallaCompleta();
    this.crearControlesMobile();
    this.cameras.main.fadeIn(1000, 0, 0, 0);

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

    this.JugadorPrincipal = new JugadorPrincipal(
      this,
      this.startX,
      this.startY,
      this.playerKey,
      this.pasos,
    ).setDepth(3);
    this.JugadorPrincipal.setCollideWorldBounds(true);
    this.physics.add.collider(this.JugadorPrincipal, colisionesLayer);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.JugadorPrincipal, true, 0.1, 0.1);

    this.JugadorPrincipal.setScale(1.8);
    this.keys = this.input.keyboard.createCursorKeys();
    this.teclaE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.npc = new Npc(this, 536, 272, 'Facu').setDepth(1);

    this.mesa = new GauchosPulperia(this, 960, 180, 'MesaEjemplo');
    this.mesa2 = new GauchosPulperia(this, 205, 495, 'MesaEjemplo2');

    this.mesasDecoracion = this.add.group();

    // Mesas decorativas de abajo (las del medio se quitaron para despejar el paso).
    this.mesa5 = new GauchosPulperia(this, 1605, 570, 'MesaEjemplo6');
    this.mesa6 = new GauchosPulperia(this, 1050, 560, 'MesaEjemplo5');

    this.mesa5.posXOriginal = 1605;
    this.mesa5.posYOriginal = 570;
    this.mesa6.posXOriginal = 1050;
    this.mesa6.posYOriginal = 560;

    this.mesasDecoracion.addMultiple([this.mesa5, this.mesa6]);

    this.mesaSolitario = new GauchosPulperia(this, 1590, 180, 'MesaSolitario');

    // Colisión: el jugador no puede pararse encima de las mesas decorativas.
    // Usamos rectángulos estáticos invisibles en coordenadas del mundo, del tamaño
    // de la mesa de madera (no del sprite completo, que incluye gauchos y sillas),
    // para poder seguir caminando entre las mesas.
    // mesaSolitario queda caminable (su "E" está en el centro de la mesa).
    // Las de abajo (mesa5/mesa6) sincronizan su colisión con la visibilidad, porque
    // MesaManager las oculta para reemplazarlas por mesas de sala que hay que pisar.
    const crearColisionMesa = (mesa) => {
      // La mesa de madera está ~37px por debajo del centro del sprite (escala 1.1).
      const rect = this.add.rectangle(mesa.x, mesa.y + 37, 128, 80).setVisible(false);
      this.physics.add.existing(rect, true); // cuerpo estático
      rect.mesaAsociada = mesa; // para sincronizar la colisión con la visibilidad
      return rect;
    };
    this.colisionesMesas = [
      crearColisionMesa(this.mesa),
      crearColisionMesa(this.mesa2),
      crearColisionMesa(this.mesa5),
      crearColisionMesa(this.mesa6),
    ];
    this.physics.add.collider(this.JugadorPrincipal, this.colisionesMesas);

    const pasosCargados = TUTORIALES.pulperia.map((paso) => {
      if (paso.enfoque === 'npc') {
        return { ...paso, enfoqueNpc: this.npc };
      }
      return paso;
    });

    this.tutorial = new Tutorial(this, 'tutorialPulperia', pasosCargados, true);
    this.tutorial.iniciar();

    this.salirAfuera = new Portal(this, 644, 656, 'MapaPrincipal', false, { x: 1600, y: 170 });
    this.physics.add.overlap(this.JugadorPrincipal, this.salirAfuera.zone);

    this.puntosDeInteraccion = [
      new PuntoInteraccion(this, 536, 378, 'tienda', false, {}),
      new PuntoInteraccion(this, 1595, 180, 'partida-solo', {}),
      new PuntoInteraccion(this, 1283, 180, 'multijugador', {
        subVista: 'tipo',
      }),
    ];

    // cartelitos sobre las mesas de juego
    const estiloCartelMesa = {
      fontFamily: '"Jersey 10"',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#573a04',
      padding: { x: 8, y: 4 },
    };
    this.cartelMultijugador = this.add
      .text(1283, 100, 'Multijugador', estiloCartelMesa)
      .setOrigin(0.5)
      .setDepth(10);
    this.cartelSolitario = this.add
      .text(1595, 100, 'Partida en solitario', estiloCartelMesa)
      .setOrigin(0.5)
      .setDepth(10);

    const salaService = this.game.registry.get('salaService');
    const uiService = this.game.registry.get('uiService');

    this.anims.create({
      key: 'MesaEspera_idle',
      frames: this.anims.generateFrameNumbers('MesaEspera', { start: 0, end: 26 }),
      frameRate: 6,
      repeat: -1,
    });

    this.anims.create({
      key: 'MesaEjemplo2_idle',
      frames: this.anims.generateFrameNumbers('MesaEjemplo2', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });

    this.mesaManager = new MesaManager(
      this,
      this.JugadorPrincipal,
      salaService,
      uiService,
      null,
      this.mesasDecoracion,
    );

    if (salaService) {
      try {
        await salaService.conectar();
        await this.mesaManager.actualizarMesas();

        this.timerBuscarSalas = this.time.addEvent({
          delay: 10000,
          callback: this.mesaManager.actualizarMesas,
          callbackScope: this.mesaManager,
          loop: true,
        });
      } catch (error) {
        console.error('No se pudo conectar al SalaService desde Phaser:', error);
      }
    }

    this.onStartMatchBound = this.manejarInicioPartida.bind(this);
    window.addEventListener('start-multiplayer-match', this.onStartMatchBound);
  }

  manejarInicioPartida() {
    if (this.timerBuscarSalas) this.timerBuscarSalas.destroy();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.route.navigate.start('TrucoPartidaMultiplayerScene', {
        salaService: this.game.registry.get('salaService'),
      });
    });
  }

  update() {
    // La colisión de las mesas sigue su visibilidad (las de sala se ocultan y hay
    // que poder pisarlas para unirse).
    if (this.colisionesMesas) {
      this.colisionesMesas.forEach((rect) => {
        const visible = rect.mesaAsociada ? rect.mesaAsociada.visible : true;
        if (rect.body && rect.body.enable !== visible) {
          rect.body.enable = visible;
        }
      });
    }

    if (this.tutorial && this.tutorial.activo) {
      this.tutorial.update();
    } else {
      this.JugadorPrincipal.update(this.keys, this.teclaE);
      const interactuoMobile = this.botonInteractuarPresionado;

      const seMueve =
        this.JugadorPrincipal.body.velocity.x !== 0 || this.JugadorPrincipal.body.velocity.y !== 0;
      if (seMueve) {
        this.estabaMoviendose = true;
      } else if (this.estabaMoviendose) {
        console.log(
          `📍 X: ${Math.round(this.JugadorPrincipal.x)}, Y: ${Math.round(this.JugadorPrincipal.y)}`,
        );
        this.estabaMoviendose = false;
      }

      this.puntosDeInteraccion.forEach((punto) => {
        punto.update(this.JugadorPrincipal, this.teclaE, interactuoMobile);
      });

      this.salirAfuera.update(this.JugadorPrincipal, this.teclaE, interactuoMobile);
      this.botonInteractuarPresionado = false;
    }
  }

  shutdown() {
    if (this.timerBuscarSalas) this.timerBuscarSalas.destroy();
    if (this.mesaManager) this.mesaManager.destroy();
    if (this.onStartMatchBound) {
      window.removeEventListener('start-multiplayer-match', this.onStartMatchBound);
    }
  }
}
