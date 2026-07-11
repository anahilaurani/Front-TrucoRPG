import Phaser from 'phaser';
import BaseScene from './BaseScene.js';
import JugadorPrincipal from '../personajes/JugadorPrincipal.js';
import Portal from '../objetos/Portal.js';
import Oponente from '../personajes/Oponente.js';
import ZonaInteraccionNpc from '../objetos/ZonaInteraccionNpc.js';
import { environment } from '../../environments/environment';

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

    this._capaBase = map.createLayer('Base', cuevaTileset);
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
    this._crearAmbienteInfernal(map);

    this.puedePelearMandinga = false;
    this.cargarPuedePelearMandinga();

    this.events.on('resume', () => this.cargarPuedePelearMandinga());
    this.game.events.on('focus', () => this.cargarPuedePelearMandinga());
  }

  /* ── Ambientación infernal ──────────────────────────────────────────────
     Todo procedural, sin assets nuevos: brasas que flotan sobre la lava,
     burbujeo con destellos, rocas prendidas fuego con humo, pulso de brillo
     en la lava, aura de Mandinga, viñeta y parpadeo de luz de fuego. */
  _crearAmbienteInfernal(map) {
    this._crearTexturasFx();

    const T = map.tileWidth;

    // celdas de lava (capa de lava, sin camino/paredes/piedras encima)
    const lavaCeldas = [];
    const piedraCeldas = new Set();
    for (let ty = 0; ty < map.height; ty++) {
      for (let tx = 0; tx < map.width; tx++) {
        if (map.hasTileAt(tx, ty, 'Piedras') || map.hasTileAt(tx, ty, 'Piedras2')) {
          piedraCeldas.add(`${tx},${ty}`);
          continue;
        }
        if (
          map.hasTileAt(tx, ty, 'PiedritasPiso/Lava') &&
          !map.hasTileAt(tx, ty, 'Camino') &&
          !map.hasTileAt(tx, ty, 'Paredes')
        ) {
          lavaCeldas.push({ tx, ty });
        }
      }
    }

    const puntoLava = () => {
      const c = Phaser.Utils.Array.GetRandom(lavaCeldas);
      return {
        x: c.tx * T + Phaser.Math.Between(4, T - 4),
        y: c.ty * T + Phaser.Math.Between(4, T - 4),
      };
    };

    // ── 1. Pulso de brillo en la lava (respiración) ──
    this.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: (tw) => {
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(
          new Phaser.Display.Color(255, 255, 255),
          new Phaser.Display.Color(255, 160, 90),
          100,
          tw.getValue(),
        );
        this._capaBase.setTint(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
      },
    });

    // ── 2. Brasas flotando sobre toda la lava ──
    this.add
      .particles(0, 0, 'fx-brasa', {
        emitZone: {
          type: 'random',
          source: {
            getRandomPoint: (v) => {
              const p = puntoLava();
              v.x = p.x;
              v.y = p.y;
            },
          },
        },
        frequency: 80,
        lifespan: { min: 1800, max: 3400 },
        speedY: { min: -32, max: -12 },
        speedX: { min: -10, max: 10 },
        scale: { start: 1.1, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: [0xffdd66, 0xffa033, 0xff5522],
        blendMode: 'ADD',
      })
      .setDepth(4);

    // ── 3. Burbujeo: erupciones cortas con destello ──
    this._burbujasLava = this.add
      .particles(0, 0, 'fx-brasa', {
        emitting: false,
        lifespan: { min: 260, max: 520 },
        speed: { min: 25, max: 75 },
        angle: { min: 210, max: 330 },
        gravityY: 140,
        scale: { start: 1.5, end: 0 },
        tint: [0xffee88, 0xff8830, 0xdd3300],
        blendMode: 'ADD',
      })
      .setDepth(4);

    this.time.addEvent({
      delay: 550,
      loop: true,
      callback: () => {
        const p = puntoLava();
        this._burbujasLava.explode(Phaser.Math.Between(4, 9), p.x, p.y);

        const destello = this.add
          .image(p.x, p.y, 'fx-glow')
          .setDepth(4)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setTint(0xff7722)
          .setAlpha(0.7)
          .setScale(0.6);
        this.tweens.add({
          targets: destello,
          scale: 2.2,
          alpha: 0,
          duration: 480,
          ease: 'Cubic.easeOut',
          onComplete: () => destello.destroy(),
        });
      },
    });

    // ── 4. Rocas prendidas fuego (solo tope de cada formación) ──
    const topesPiedra = [...piedraCeldas]
      .map((k) => k.split(',').map(Number))
      .filter(([tx, ty]) => !piedraCeldas.has(`${tx},${ty - 1}`));
    Phaser.Utils.Array.Shuffle(topesPiedra)
      .slice(0, 8)
      .forEach(([tx, ty]) => {
        const x = tx * T + T / 2;
        const y = ty * T + 10;

        // llamas
        this.add
          .particles(x, y, 'fx-brasa', {
            frequency: 45,
            quantity: 2,
            lifespan: { min: 320, max: 680 },
            speedY: { min: -48, max: -26 },
            speedX: { min: -11, max: 11 },
            scale: { start: 1.7, end: 0 },
            tint: [0xffee66, 0xffaa22, 0xff5511, 0xcc2200],
            blendMode: 'ADD',
          })
          .setDepth(3);

        // humo
        this.add
          .particles(x, y - 8, 'fx-brasa', {
            frequency: 200,
            lifespan: { min: 900, max: 1700 },
            speedY: { min: -26, max: -14 },
            speedX: { min: -7, max: 7 },
            scale: { start: 1.3, end: 2.6 },
            alpha: { start: 0.35, end: 0 },
            tint: 0x332222,
          })
          .setDepth(3);
      });

    // ── 5. Aura maligna pulsante bajo Mandinga ──
    const aura = this.add
      .image(MANDINGA_X, MANDINGA_Y + 18, 'fx-glow')
      .setDepth(0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0xff2200)
      .setAlpha(0.45)
      .setScale(3.2);
    this.tweens.add({
      targets: aura,
      alpha: 0.2,
      scale: 2.6,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── 6. Viñeta oscura (solo WebGL) ──
    if (this.game.renderer.type === Phaser.WEBGL) {
      this.cameras.main.postFX.addVignette(0.5, 0.5, 0.92, 0.42);
    }

    // ── 7. Parpadeo de luz de fuego sobre toda la escena ──
    this._luzFuego = this.add
      .rectangle(0, 0, this.scale.width * 2, this.scale.height * 2, 0xff4400, 0.05)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(50)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.time.addEvent({
      delay: 130,
      loop: true,
      callback: () => this._luzFuego.setAlpha(Phaser.Math.FloatBetween(0.02, 0.09)),
    });
  }

  _crearTexturasFx() {
    if (!this.textures.exists('fx-brasa')) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xffffff);
      g.fillRect(0, 0, 4, 4);
      g.generateTexture('fx-brasa', 4, 4);
      g.destroy();
    }
    if (!this.textures.exists('fx-glow')) {
      const g = this.make.graphics({ add: false });
      for (let r = 16; r > 0; r--) {
        g.fillStyle(0xffffff, 0.07);
        g.fillCircle(16, 16, r);
      }
      g.generateTexture('fx-glow', 32, 32);
      g.destroy();
    }
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
        `/api/historia/rivales/${RIVAL_MANDINGA_NIVEL}/puedePelear`,
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
