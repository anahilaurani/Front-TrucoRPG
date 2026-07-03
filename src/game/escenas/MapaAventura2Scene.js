import Phaser from 'phaser';
import BaseScene from './BaseScene.js';
import JugadorPrincipal from '../personajes/JugadorPrincipal.js';
import Oponente from '../personajes/Oponente.js';
import Portal from '../objetos/Portal.js';
import ZonaInteraccionNpc from '../objetos/ZonaInteraccionNpc.js';

const RIVAL_LOBIZON_NIVEL = 3;
const RIVAL_LUZMALA_NIVEL = 4;

const JEFE1_X = 475;
const JEFE1_Y = 445;

const JEFE2_X = 1086;
const JEFE2_Y = 139;

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default class MapaAventura2Scene extends BaseScene {
  constructor() {
    super('MapaAventura2');
  }

  init(data) {
    this.playerKey = data.playerSprite || this.registry.get('playerSprite') || 'nene-hacha';
    this.startX = data.x ?? 1078;
    this.startY = data.y ?? 611;
    this.claseHeroe = data.claseHeroe ?? this.registry.get('claseHeroe') ?? null;
  }

  preload() {
    this.load.audio('pasos', './assets/musica/sonidos/paso.ogg');
    this.load.spritesheet('lobizon', './assets/sprites/lobizon.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('luzmala', './assets/sprites/luzmala.png', { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    this.botonPantallaCompleta();
    this.crearControlesMobile();
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    const map = this.make.tilemap({ key: 'mapa-aventura-2' });

    const cuevaTileset = map.addTilesetImage('Cueva', 'Cueva Av2');
    const cuevaDecoracionTileset = map.addTilesetImage('CuevaDecoracion', 'CuevaDecoracion Av2');

    map.createLayer('Base', cuevaTileset);
    map.createLayer('Camino', [cuevaTileset, cuevaDecoracionTileset]);
    map.createLayer('PiedritasPiso/Agua', cuevaTileset);
    map.createLayer('Agujeros', cuevaTileset);
    map.createLayer('Paredes', cuevaTileset);
    map.createLayer('Piedras', [cuevaTileset, cuevaDecoracionTileset]);
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

    this.portalMapaAventura3 = new Portal(this, 1109, 35, 'MapaAventura3', false, {
      x: 94,
      y: 447,
    });

    this.portalMapaAventura1 = new Portal(this, 1106, 669, 'MapaAventura1', false, {
      x: 1092,
      y: 131,
    });

    this._crearJefeLobizon();
    this._crearJefeLuzMala();

    this.puedePelearLobizon = false;
    this.puedePelearLuzMala = false;
    this.cargarPuedePelearLobizon();
    this.cargarPuedePelearLuzMala(false);

    this._onProgresoActualizado = () => {
      this.cargarPuedePelearLobizon();
      this.cargarPuedePelearLuzMala(true);
    };
    this._onTrucoEnd = () => {
      this.cargarPuedePelearLobizon();
      this.cargarPuedePelearLuzMala(true);
    };
    window.addEventListener('historia:progreso-actualizado', this._onProgresoActualizado);
    window.addEventListener('truco-solo:end', this._onTrucoEnd);
  }

  shutdown() {
    window.removeEventListener('historia:progreso-actualizado', this._onProgresoActualizado);
    window.removeEventListener('truco-solo:end', this._onTrucoEnd);
  }

  _crearJefeLobizon() {
    this.jefeLobizon = new Oponente(this, JEFE1_X, JEFE1_Y, 'lobizon').setDepth(0).setScale(3);
    this.zonaJefe1 = new ZonaInteraccionNpc(this, JEFE1_X, JEFE1_Y);
    this.etiquetaBloqueoLobizon = this.add
      .text(JEFE1_X, JEFE1_Y - 55, 'Derrotá al Pomberito antes', {
        fontFamily: '"Jersey 10"',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#573a04',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  _crearJefeLuzMala() {
    new Oponente(this, JEFE2_X, JEFE2_Y, 'luzmala').setDepth(0).setScale(2);
    this.zonaJefe2 = new ZonaInteraccionNpc(this, JEFE2_X, JEFE2_Y);
    this.etiquetaBloqueoLuzMala = this.add
      .text(JEFE2_X, JEFE2_Y - 55, 'Derrotá al Lobizón antes', {
        fontFamily: '"Jersey 10"',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#573a04',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  async cargarPuedePelearLobizon() {
    try {
      const res = await fetch(
        `/api/historia/rivales/${RIVAL_LOBIZON_NIVEL}/puede-pelear`,
        { headers: authHeaders() },
      );
      if (!res.ok) return;

      const data = await res.json();
      this.puedePelearLobizon = !!data.puedePelear;
      this._actualizarEtiquetaBloqueoLobizon();
    } catch {
      this.puedePelearLobizon = false;
      this._actualizarEtiquetaBloqueoLobizon();
    }
  }

  _actualizarEtiquetaBloqueoLobizon() {
    if (!this.etiquetaBloqueoLobizon) return;
    this.etiquetaBloqueoLobizon.setVisible(!this.puedePelearLobizon);
  }

  async cargarPuedePelearLuzMala(animar = false) {
    try {
      const res = await fetch(
        `/api/historia/rivales/${RIVAL_LUZMALA_NIVEL}/puede-pelear`,
        { headers: authHeaders() },
      );
      if (!res.ok) return;

      const data = await res.json();
      this.puedePelearLuzMala = !!data.puedePelear;
      this._actualizarEtiquetaBloqueoLuzMala();
      this._actualizarDerrotaLobizon(animar);
    } catch {
      this.puedePelearLuzMala = false;
      this._actualizarEtiquetaBloqueoLuzMala();
    }
  }

  // Si puede pelear con la Luz Mala es porque el Lobizón ya fue derrotado.
  _actualizarDerrotaLobizon(animar) {
    if (!this.puedePelearLuzMala) return;

    const jefe = this.jefeLobizon;
    if (!jefe || jefe.derrotado || jefe.cayendo) return;

    if (animar) {
      this.animarDerrotaJefe(jefe);
    } else {
      jefe.caerDerrotado(false);
    }
  }

  _actualizarEtiquetaBloqueoLuzMala() {
    if (!this.etiquetaBloqueoLuzMala) return;
    this.etiquetaBloqueoLuzMala.setVisible(!this.puedePelearLuzMala);
  }

  iniciarPelea(rivalNivel) {
    if (this.claseHeroe !== null) {
      localStorage.setItem('heroeId', String(this.claseHeroe));
    }
    localStorage.setItem('rivalNivel', String(rivalNivel));
    localStorage.setItem('historiaPartida', '1');
    window.dispatchEvent(new CustomEvent('truco-solo:start'));
  }

  update() {
    // durante la animación de derrota se frena todo
    if (this._animandoDerrota) {
      this.JugadorPrincipal.setVelocity(0);
      this.botonInteractuarPresionado = false;
      return;
    }

    this.JugadorPrincipal.update(this.keys, this.teclaE);

    const interactuoMobile = this.botonInteractuarPresionado;

    this.portalMapaAventura3.update(this.JugadorPrincipal, this.teclaE, interactuoMobile);
    this.portalMapaAventura1.update(this.JugadorPrincipal, this.teclaE, interactuoMobile);

    const lobizonDisponible =
      this.puedePelearLobizon &&
      !this.jefeLobizon.derrotado &&
      !this.jefeLobizon.cayendo;

    const enZonaJefe1 = this.zonaJefe1.update(this.JugadorPrincipal, lobizonDisponible);
    const enZonaJefe2 = this.zonaJefe2.update(
      this.JugadorPrincipal,
      this.puedePelearLuzMala,
    );

    const interactuar =
      Phaser.Input.Keyboard.JustDown(this.teclaE) ||
      this.botonInteractuarPresionado;

    if (enZonaJefe1 && interactuar && lobizonDisponible) {
      this.iniciarPelea(RIVAL_LOBIZON_NIVEL);
    }

    if (enZonaJefe2 && interactuar && this.puedePelearLuzMala) {
      this.iniciarPelea(RIVAL_LUZMALA_NIVEL);
    }

    this.botonInteractuarPresionado = false;
  }
}
