import Phaser from 'phaser';
import BaseScene from './BaseScene.js';
import JugadorPrincipal from '../personajes/JugadorPrincipal.js';
import Portal from '../objetos/Portal.js';
import Oponente from '../personajes/Oponente.js';
import ZonaInteraccionNpc from '../objetos/ZonaInteraccionNpc.js';

const RIVAL_MANDINGA_NIVEL = 5;

const MANDINGA_X = 1068;
const MANDINGA_Y = 325;

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default class MapaAventura3Scene extends BaseScene {
  constructor() {
    super('MapaAventura3');
  }

  init(data) {
    this.playerKey = data.playerSprite || this.registry.get('playerSprite') || 'nene-hacha';
    this.startX = data.x || 1078;
    this.startY = data.y || 611;
  }

  preload() {
    this.load.audio('pasos', './assets/musica/sonidos/paso.ogg');
    this.load.spritesheet('mandinga', './assets/sprites/mandinga.png', { frameWidth: 64, frameHeight: 64 });
  }

  create() {
    this.botonPantallaCompleta();
    this.crearControlesMobile();

    const map = this.make.tilemap({ key: 'mapa-aventura-3' });

    const cuevaTileset = map.addTilesetImage('Cueva', 'Cueva Av3');
    const cuevaDecoracionTileset = map.addTilesetImage('CuevaDecoracion', 'CuevaDecoracion Av3');
    const tronoTileset = map.addTilesetImage('Trono', 'Trono Av3');

    map.createLayer('Base', cuevaTileset);
    map.createLayer('Camino', [cuevaTileset, cuevaDecoracionTileset]);
    map.createLayer('PiedritasPiso/Lava', cuevaTileset);
    map.createLayer('Paredes', cuevaTileset);
    map.createLayer('Piedras', [cuevaTileset, cuevaDecoracionTileset, tronoTileset]);
    map.createLayer('Piedras2', [cuevaTileset, cuevaDecoracionTileset]);

    const colisionesLayer = map.createLayer('Colisiones', cuevaTileset);
    colisionesLayer.setCollisionByExclusion([-1]);

    this.JugadorPrincipal = new JugadorPrincipal(
      this,
      this.startX,
      this.startY,
      this.playerKey,
    ).setDepth(1);
    this.JugadorPrincipal.setCollideWorldBounds(true);
    this.physics.add.collider(this.JugadorPrincipal, colisionesLayer);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.JugadorPrincipal, true, 0.1, 0.1);
    this.JugadorPrincipal.setScale(1.1);

    this.keys = this.input.keyboard.createCursorKeys();
    this.teclaE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.portalMapaAventura2 = new Portal(this, 35, 492, 'MapaAventura2', false, {
      x: 1109,
      y: 35,
    });
    this.physics.add.overlap(this.JugadorPrincipal, this.portalMapaAventura2.zone);

    this._crearJefeMandinga();

    this.puedePelearMandinga = false;
    this.cargarPuedePelearMandinga();

    this.events.on('resume', () => this.cargarPuedePelearMandinga());
    this.game.events.on('focus', () => this.cargarPuedePelearMandinga());
  }

  _crearJefeMandinga() {
    this.oponenteMandinga = new Oponente(this, MANDINGA_X, MANDINGA_Y, 'mandinga').setDepth(0);
    this.oponenteMandinga.setScale(1.3);
    this.zonaMandinga = new ZonaInteraccionNpc(this, MANDINGA_X, MANDINGA_Y);
    this.etiquetaBloqueoMandinga = this.add
      .text(MANDINGA_X, MANDINGA_Y - 55, 'Derrotá a La Luz Mala antes', {
        fontFamily: '"Jersey 10"',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#573a04',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  async cargarPuedePelearMandinga() {
    try {
      const res = await fetch(
        `/api/historia/rivales/${RIVAL_MANDINGA_NIVEL}/puede-pelear`,
        { headers: authHeaders() },
      );
      if (!res.ok) return;

      const data = await res.json();
      this.puedePelearMandinga = !!data.puedePelear;
      this._actualizarEtiquetaBloqueoMandinga();
    } catch {
      this.puedePelearMandinga = false;
      this._actualizarEtiquetaBloqueoMandinga();
    }
  }

  _actualizarEtiquetaBloqueoMandinga() {
    if (!this.etiquetaBloqueoMandinga) return;
    this.etiquetaBloqueoMandinga.setVisible(!this.puedePelearMandinga);
  }

  iniciarPelea(rivalNivel) {
    const claseHeroe = this.registry.get('claseHeroe');
    if (claseHeroe !== null && claseHeroe !== undefined) {
      localStorage.setItem('heroeId', String(claseHeroe));
    }
    localStorage.setItem('rivalNivel', String(rivalNivel));
    localStorage.setItem('historiaPartida', '1');
    window.dispatchEvent(new CustomEvent('truco-solo:start'));
  }

  update() {
    this.JugadorPrincipal.update(this.keys, this.teclaE);

    const interactuoMobile = this.botonInteractuarPresionado;

    this.portalMapaAventura2.update(this.JugadorPrincipal, this.teclaE, interactuoMobile);

    const enZonaMandinga = this.zonaMandinga.update(
      this.JugadorPrincipal,
      this.puedePelearMandinga,
    );
    const interactuar = this.teclaE.isDown || interactuoMobile;

    if (enZonaMandinga && interactuar && this.puedePelearMandinga) {
      this.iniciarPelea(RIVAL_MANDINGA_NIVEL);
    }

    if (this.botonInteractuarPresionado) {
      this.botonInteractuarPresionado = false;
    }
  }
}
