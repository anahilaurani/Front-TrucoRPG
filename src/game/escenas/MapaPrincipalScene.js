import BaseScene from './BaseScene.js';
import JugadorPrincipal from '../personajes/JugadorPrincipal.js';
import Portal from '../objetos/Portal.js';
import Npc from '../personajes/Npc.js';
import Tutorial from '../objetos/Tutorial.js';
import { TUTORIALES } from '../data/tutoriales.js';

export default class MapaPrincipalScene extends BaseScene {
  constructor() {
    super('MapaPrincipal');
  }

  init(data) {
    this.playerKey = data.playerSprite || 'player';
    this.startX = data.x || 85;
    this.startY = data.y || 470;
  }

  preload() {
    this.load.image('CartelOponentes', './assets/mapa-principal/CartelOponentes.png');

    this.load.audio('pasos', './assets/musica/sonidos/paso.ogg');
  }

  create() {
    this.botonPantallaCompleta();
    this.crearControlesMobile();

    // A PARTIR DE ACÁ LA CREACION DEL MAPA CON TILEEEED
    const map = this.make.tilemap({ key: 'mapa' });

    const pisoTileset = map.addTilesetImage('Piso 2', 'Piso 2');
    const arbol1Tileset = map.addTilesetImage('Arbol 1', 'Arbol 1');
    const arbol2Tileset = map.addTilesetImage('Arbol 2', 'Arbol 2');
    const arbol3Tileset = map.addTilesetImage('Arbol 3', 'Arbol 3');
    const fuegoTileset = map.addTilesetImage('Fuego', 'Fuego');
    const mateTileset = map.addTilesetImage('Mate', 'Mate');
    const paredesTileset = map.addTilesetImage('Paredes', 'Paredes');
    const partesTileset = map.addTilesetImage('Partes', 'Partes');
    const pavaTileset = map.addTilesetImage('Pava', 'Pava');
    const piedrasTileset = map.addTilesetImage('Piedras', 'Piedras');
    const techosTileset = map.addTilesetImage('Techos', 'Techos');
    const vegetacionTileset = map.addTilesetImage('Vegetacion', 'Vegetacion');
    const pulperiaTileset = map.addTilesetImage('Pulperia', 'Pulperia');

    map.createLayer('Base', pisoTileset);
    map.createLayer('Pasto', [piedrasTileset, vegetacionTileset]);
    map.createLayer('Camino', pisoTileset);
    const arbolesLayer = map.createLayer('Arboles', [vegetacionTileset, arbol1Tileset]);
    const arboles2Layer = map.createLayer('Arboles 2', [arbol2Tileset]);
    const arboles3Layer = map.createLayer('Arboles 3', [arbol3Tileset, partesTileset]);
    map.createLayer('Casas', [
      paredesTileset,
      techosTileset,
      fuegoTileset,
      partesTileset,
      pulperiaTileset,
    ]);
    map.createLayer('Objetos-Casa', [
      partesTileset,
      mateTileset,
      pavaTileset,
      fuegoTileset,
      pulperiaTileset,
    ]);

    arbolesLayer.setDepth(2);
    arboles2Layer.setDepth(2);
    arboles3Layer.setDepth(2);

    const colisionesLayer = map.createLayer('Colisiones', pisoTileset);
    colisionesLayer.setCollisionByExclusion([-1]);

    this.JugadorPrincipal = new JugadorPrincipal(
      this,
      this.startX,
      this.startY,
      this.playerKey,
      this.pasos,
    ).setDepth(1);
    this.JugadorPrincipal.setCollideWorldBounds(true);

    this.physics.add.collider(this.JugadorPrincipal, colisionesLayer);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.JugadorPrincipal, true, 0.1, 0.1);

    this.JugadorPrincipal.setScale(1.3);

    this.keys = this.input.keyboard.createCursorKeys();
    this.teclaE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.portalACasa = new Portal(this, 464, 195, 'InteriorCasaScene', false, { x: 627, y: 640 });
    this.physics.add.overlap(this.JugadorPrincipal, this.portalACasa.zone);

    this.portalAPulperia = new Portal(this, 1603, 163, 'InteriorPulperiaScene', false, {
      x: 627,
      y: 640,
    });
    this.physics.add.overlap(this.JugadorPrincipal, this.portalAPulperia.zone);

    this.portalAOponentes = new Portal(this, 1917, 300, 'MapaAventura1', 'CartelOponentes', {
      x: 35,
      y: 552,
    });

    this.npc = new Npc(this, 333, 438, 'Nuri').setDepth(1);
    this.npc.setScale(1.3);

    const pasosCargados = TUTORIALES.mapaPrincipal.map((paso) => {
      if (paso.enfoque === 'npc') {
        return { ...paso, enfoqueNpc: this.npc };
      }
      return paso;
    });

    this.tutorial = new Tutorial(this, 'tutorialLobby', pasosCargados,true);

    this.tutorial.iniciar();
  }

  update() {
    if (this.tutorial && this.tutorial.activo) {
      this.tutorial.update();
      return;
    }

    this.JugadorPrincipal.update(this.keys, this.teclaE);

    const seMueve =
      this.JugadorPrincipal.body.velocity.x !== 0 || this.JugadorPrincipal.body.velocity.y !== 0;
    if (seMueve) {
      this.estabaMoviendose = true;
    } else if (this.estabaMoviendose) {
      const xActual = Math.round(this.JugadorPrincipal.x);
      const yActual = Math.round(this.JugadorPrincipal.y);
      console.log(`📍 Personaje parado en coordenadas -> X: ${xActual}, Y: ${yActual}`);
      this.estabaMoviendose = false;
    }

    const interactuoMobile = this.botonInteractuarPresionado;

    this.portalACasa.update(this.JugadorPrincipal, this.teclaE, interactuoMobile);
    this.portalAPulperia.update(this.JugadorPrincipal, this.teclaE, interactuoMobile);
    this.portalAOponentes.update(this.JugadorPrincipal, this.teclaE, interactuoMobile);

    if (this.botonInteractuarPresionado) {
      this.botonInteractuarPresionado = false;
    }
  }
}
