import Phaser from 'phaser';
import BaseScene from './BaseScene.js';
import JugadorPrincipal from '../personajes/JugadorPrincipal.js';
import Portal from '../objetos/Portal.js';
import Oponente from '../personajes/Oponente.js';
import ZonaInteraccionNpc from '../objetos/ZonaInteraccionNpc.js';
import NpcDialogo from '../personajes/NpcDialogo.js';
import BarreraJefe from '../objetos/BarreraJefe.js';

const RIVAL_NAHUELITO_NIVEL = 1;
const RIVAL_POMBERITO_NIVEL = 2;
const RIVAL_SIGUIENTE_A_POMBERITO_NIVEL = 3;

// Barrera al final del puente (lado derecho)
const BARRERA_PUENTE_X = 948;
const BARRERA_PUENTE_Y = 368;
const BARRERA_PUENTE_ALTO = 160;

// Coordenadas del jefe Nahuelito
const JEFE1_X = 550;
const JEFE1_Y = 285;

// Coordenadas del jefe Pomberito
const JEFE2_X = 1102;
const JEFE2_Y = 219;

// coords npc para hablar
const NPC_ALDEANO_X = 141;
const NPC_ALDEANO_Y = 313;

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}


export default class MapaAventura1Scene extends BaseScene {
  constructor() {
    super('MapaAventura1');
  }

  init(data) {
    this.playerKey = data.playerSprite || this.registry.get('playerSprite') || 'nene-hacha';
    this.startX = data.x ?? 85;
    this.startY = data.y ?? 470;
    this.claseHeroe = data.claseHeroe ?? this.registry.get('claseHeroe') ?? null;
  }

  preload() {
    this.load.audio('pasos', './assets/musica/sonidos/paso.ogg');
    this.load.spritesheet('nahuelito', './assets/sprites/nahuelito.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('pomberito', './assets/sprites/pomberito.png', { frameWidth: 64, frameHeight: 64 });
  }

  create() {
    this.botonPantallaCompleta();
    this.crearControlesMobile();
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    const map = this.make.tilemap({ key: 'mapa-aventura-1' });

    const sueloTileset = map.addTilesetImage('Suelo', 'Suelo');
    const vegetacionTileset = map.addTilesetImage('Vegetacion', 'Vegetacion Av');
    const piedrasTileset = map.addTilesetImage('Piedras', 'Piedras Av');
    const arbol2Tileset = map.addTilesetImage('Arbol2', 'Arbol 2 Av');
    const arbol1Tileset = map.addTilesetImage('Arbol1', 'Arbol 1 Av');
    const aguaTileset = map.addTilesetImage('Agua', 'Agua');
    const fogataTileset = map.addTilesetImage('Fogata', 'Fuego Av');
    const paredesMontañaTileset = map.addTilesetImage('ParedesMontaña', 'ParedesMontaña');
    const paredesCuevaTileset = map.addTilesetImage('ParedesCueva', 'ParedesCueva');
    const cuevaTileset = map.addTilesetImage('Cueva', 'Cueva Av');

    map.createLayer('Base', sueloTileset);
    map.createLayer('Agua', aguaTileset);
    map.createLayer('Montañas', [sueloTileset, paredesCuevaTileset, paredesMontañaTileset]);
    map.createLayer('Camino', [sueloTileset, cuevaTileset]);
    map.createLayer('Pasto/Vegetacion', [vegetacionTileset, piedrasTileset]);
    map.createLayer('Piedras', piedrasTileset);

    const arbolesLayer = map.createLayer('Arboles', [
      arbol1Tileset,
      arbol2Tileset,
      vegetacionTileset,
    ]);
    const arboles2Layer = map.createLayer('Arboles2', [
      arbol1Tileset,
      arbol2Tileset,
      vegetacionTileset,
    ]);
    const arboles3Layer = map.createLayer('Arboles 3', [arbol1Tileset, arbol2Tileset]);

    arbolesLayer.setDepth(2);
    arboles2Layer.setDepth(2);
    arboles3Layer.setDepth(2);

    map.createLayer('Objetos', [fogataTileset, paredesCuevaTileset]);

    const colisionesLayer = map.createLayer('Colisiones', sueloTileset);
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

    this.JugadorPrincipal.setScale(1.4);

    this.keys = this.input.keyboard.createCursorKeys();
    this.teclaE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // portal mapa aventura 2 (bloqueado hasta derrotar al Pomberito)
    this.portalMapaAventura2 = new Portal(this, 1092, 131, 'MapaAventura2', false, {
      x: 1078,
      y: 611,
    });
    this.portalMapaAventura2.mensajeBloqueo = 'Derrotá al Pomberito antes de entrar';

    // barrera al final del puente (bloqueada hasta derrotar al Nahuelito)
    this.barreraPuente = new BarreraJefe(
      this,
      BARRERA_PUENTE_X,
      BARRERA_PUENTE_Y,
      BARRERA_PUENTE_ALTO,
      'Derrotá al Nahuelito para pasar',
    );
    this.barreraPuente.agregarColision(this.JugadorPrincipal);

    // portal volver al mapa principal
    this.portalMapaPrincipal = new Portal(this, 35, 552, 'MapaPrincipal', false, {
      x: 1917,
      y: 352,
    });

    this._crearJefeNahuelito();
    this._crearJefePomberito();

    //npc para charlar
    this.npcAldeano = new NpcDialogo(this, NPC_ALDEANO_X, NPC_ALDEANO_Y, 'Ale', [
      '¡Hola, aventurero!\nBienvenido a estas tierras.',
      'El Nahuelito merodea\npor el lago... tené cuidado.',
      'Dicen que si lo derrotás,\nel Pomberito te dejará desafiarlo.',
      'Ambos están al servicio,\nde mandinga.',
      'Por favor ayudá,\na nuestro pueblo.',
      'Mientras tanto yo ,\nvoy a seguir buscando inspiración.',
      'Mi sueño es\ndibujar como Molina Campos\nsoy su gran fan!.',
    ]);

    this._crearAsado(map);

    this.puedePelearPomberito = false;
    this.puedeEntrarCueva = false;
    this.cargarPuedePelearPomberito(false);
    this.cargarPuedeEntrarCueva(false);

    this._onProgresoActualizado = () => {
      this.cargarPuedePelearPomberito(true);
      this.cargarPuedeEntrarCueva(true);
    };
    this._onTrucoEnd = () => {
      this.cargarPuedePelearPomberito(true);
      this.cargarPuedeEntrarCueva(true);
    };
    window.addEventListener('historia:progreso-actualizado', this._onProgresoActualizado);
    window.addEventListener('truco-solo:end', this._onTrucoEnd);
  }

  shutdown() {
    window.removeEventListener('historia:progreso-actualizado', this._onProgresoActualizado);
    window.removeEventListener('truco-solo:end', this._onTrucoEnd);
  }

  /* ── Asado de Ale ───────────────────────────────────────────────────────
     Sobre la fogata de piedras: fuego, parrilla pixel-art con carne y
     chorizos, humo subiendo y resplandor titilante. Todo procedural. */
  _crearAsado(map) {
    this._crearTexturasFx();
    this._crearTexturaParrilla();

    // se saca la fogata de piedras del tilemap (celdas 5-6, 9-10):
    // el fogón ahora es el del asado, con sus propias piedras
    [[5, 9], [6, 9], [5, 10], [6, 10]].forEach(([tx, ty]) =>
      map.removeTileAt(tx, ty, false, false, 'Objetos'),
    );

    // Cerca de Ale pero sin pisar el camino al puente ni su zona de diálogo.
    const X = 238;
    const Y = 282;

    // piedras del fogón
    this.add.image(X, Y + 12, 'fx-piedras-asado').setDepth(0);

    // colisión: que nadie se pare arriba del asado
    const bloqueo = this.add.zone(X, Y + 2, 46, 32);
    this.physics.add.existing(bloqueo, true);
    this.physics.add.collider(this.JugadorPrincipal, bloqueo);

    // resplandor titilante del fuego
    const brillo = this.add
      .image(X, Y, 'fx-glow')
      .setDepth(0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0xff6622)
      .setAlpha(0.5)
      .setScale(2.1);
    this.tweens.add({
      targets: brillo,
      alpha: 0.25,
      scale: 1.7,
      duration: 380,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // llamas entre las piedras (debajo de la parrilla)
    this.add
      .particles(X, Y + 4, 'fx-brasa', {
        frequency: 55,
        quantity: 2,
        lifespan: { min: 280, max: 620 },
        speedY: { min: -38, max: -18 },
        speedX: { min: -8, max: 8 },
        emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-14, -4, 28, 8) },
        scale: { start: 1.5, end: 0 },
        tint: [0xffee66, 0xffaa22, 0xff5511, 0xcc2200],
        blendMode: 'ADD',
      })
      .setDepth(2);

    // parrilla con la carne
    this.add.image(X, Y - 6, 'fx-parrilla').setDepth(2);

    // humo del asado
    this.add
      .particles(X, Y - 16, 'fx-brasa', {
        frequency: 120,
        lifespan: { min: 1300, max: 2400 },
        speedY: { min: -26, max: -14 },
        speedX: { min: -5, max: 11 },
        scale: { start: 1.4, end: 3.2 },
        alpha: { start: 0.4, end: 0 },
        tint: [0x777777, 0x999999, 0x555555],
      })
      .setDepth(3);
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

  _crearTexturaParrilla() {
    if (!this.textures.exists('fx-piedras-asado')) {
      const g = this.make.graphics({ add: false });
      // ronda de piedras grises con sombra
      const piedras = [
        [6, 8, 7], [18, 12, 6], [30, 13, 7], [42, 11, 6], [52, 7, 6],
        [12, 4, 5], [26, 3, 6], [40, 3, 5], [48, 4, 4],
      ];
      piedras.forEach(([x, y, r]) => {
        g.fillStyle(0x2e2e2e);
        g.fillCircle(x + 1, y + 2, r);
        g.fillStyle(0x5c5c5c);
        g.fillCircle(x, y, r);
        g.fillStyle(0x7a7a7a);
        g.fillCircle(x - 1, y - 2, r * 0.5);
      });
      g.generateTexture('fx-piedras-asado', 60, 22);
      g.destroy();
    }

    if (this.textures.exists('fx-parrilla')) return;
    const g = this.make.graphics({ add: false });

    // patas de hierro
    g.fillStyle(0x1a1a1a);
    g.fillRect(4, 16, 3, 12);
    g.fillRect(41, 16, 3, 12);

    // marco
    g.fillStyle(0x232323);
    g.fillRect(0, 6, 48, 14);

    // barras de la parrilla
    g.fillStyle(0x5a5a5a);
    for (let y = 8; y <= 18; y += 3) {
      g.fillRect(2, y, 44, 1);
    }

    // bife 1
    g.fillStyle(0x5e2018);
    g.fillRect(6, 8, 13, 9);
    g.fillStyle(0x9c4030);
    g.fillRect(7, 9, 11, 7);
    g.fillStyle(0xb85b40);
    g.fillRect(9, 10, 6, 3);

    // bife 2
    g.fillStyle(0x5e2018);
    g.fillRect(31, 10, 12, 8);
    g.fillStyle(0x8f3a28);
    g.fillRect(32, 11, 10, 6);
    g.fillStyle(0xad5238);
    g.fillRect(34, 12, 5, 3);

    // chorizos
    g.fillStyle(0x4e1c12);
    g.fillRect(21, 8, 4, 10);
    g.fillStyle(0x7a2f22);
    g.fillRect(22, 9, 2, 8);
    g.fillStyle(0x4e1c12);
    g.fillRect(26, 9, 4, 9);
    g.fillStyle(0x74301f);
    g.fillRect(27, 10, 2, 7);

    g.generateTexture('fx-parrilla', 48, 30);
    g.destroy();
  }

  _crearJefeNahuelito() {
    this.jefeNahuelito = new Oponente(this, JEFE1_X, JEFE1_Y, 'nahuelito').setDepth(0).setScale(2);
    this.zonaJefe1 = new ZonaInteraccionNpc(this, JEFE1_X, JEFE1_Y);
  }

  _crearJefePomberito() {
    this.jefePomberito = new Oponente(this, JEFE2_X, JEFE2_Y, 'pomberito').setDepth(0).setScale(1);
    this.zonaJefe2 = new ZonaInteraccionNpc(this, JEFE2_X, JEFE2_Y);
    this.etiquetaBloqueoPomberito = this.add
      .text(JEFE2_X, JEFE2_Y - 55, 'Derrotá al Nahuelito antes', {
        fontFamily: '"Jersey 10"',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#573a04',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  async cargarPuedePelearPomberito(animarBarrera = false) {
    try {
      const res = await fetch(
        `/api/historia/rivales/${RIVAL_POMBERITO_NIVEL}/puedePelear`,
        { headers: authHeaders() },
      );
      if (!res.ok) return;

      const data = await res.json();
      this.puedePelearPomberito = !!data.puedePelear;
      this.motivoBloqueoPomberito = data.motivo ?? null;
      this._actualizarEtiquetaBloqueoPomberito();
      this._actualizarDerrotaNahuelito(animarBarrera);
    } catch {
      this.puedePelearPomberito = false;
      this._actualizarEtiquetaBloqueoPomberito();
    }
  }

  // Si puede pelear con el Pomberito es porque el Nahuelito ya fue derrotado:
  // el jefe cae, desaparece del lago y después se desbloquea la barrera del puente.
  _actualizarDerrotaNahuelito(animar) {
    if (!this.puedePelearPomberito) return;

    const jefe = this.jefeNahuelito;
    if (!jefe || jefe.derrotado || jefe.cayendo) return;

    if (animar) {
      this.animarDerrotaJefe(jefe, {
        desaparecer: true,
        alTerminar: () => this.barreraPuente.desbloquear(this.JugadorPrincipal),
      });
    } else {
      jefe.caerDerrotado(false, undefined, true);
      this.barreraPuente.desbloquearInmediato();
    }
  }

  // Si puede entrar a la cueva es porque el Pomberito ya fue derrotado.
  _actualizarDerrotaPomberito(animar) {
    if (!this.puedeEntrarCueva) return;

    const jefe = this.jefePomberito;
    if (!jefe || jefe.derrotado || jefe.cayendo) return;

    if (animar) {
      this.animarDerrotaJefe(jefe);
    } else {
      jefe.caerDerrotado(false);
    }
  }

  async cargarPuedeEntrarCueva(animar = false) {
    try {
      const res = await fetch(
        `/api/historia/rivales/${RIVAL_SIGUIENTE_A_POMBERITO_NIVEL}/puedePelear`,
        { headers: authHeaders() },
      );
      if (!res.ok) return;

      const data = await res.json();
      // si puede pelear con el rival de nivel 3, el Pomberito ya fue derrotado
      this.puedeEntrarCueva = !!data.puedePelear;
      this._actualizarDerrotaPomberito(animar);
    } catch {
      this.puedeEntrarCueva = false;
    }
  }

  _actualizarEtiquetaBloqueoPomberito() {
    if (!this.etiquetaBloqueoPomberito) return;
    this.etiquetaBloqueoPomberito.setVisible(!this.puedePelearPomberito);
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
    // durante las animaciones de derrota/desbloqueo se frena todo
    if (this._animandoDerrota || this.barreraPuente?.animando) {
      this.JugadorPrincipal.setVelocity(0);
      this.botonInteractuarPresionado = false;
      return;
    }

    // si el dialogo esta abierto bloquea el resto
    if (this.npcAldeano.dialogoAbierto) {
      this.npcAldeano.update(this.JugadorPrincipal, this.teclaE, this.botonInteractuarPresionado);
      this.botonInteractuarPresionado = false;
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

    this.portalMapaAventura2.update(
      this.JugadorPrincipal,
      this.teclaE,
      interactuoMobile,
      this.puedeEntrarCueva,
    );
    this.portalMapaPrincipal.update(this.JugadorPrincipal, this.teclaE, interactuoMobile);


    this.npcAldeano.update(this.JugadorPrincipal, this.teclaE, interactuoMobile);

    const nahuelitoDisponible = !this.jefeNahuelito.derrotado && !this.jefeNahuelito.cayendo;
    const pomberitoDisponible =
      this.puedePelearPomberito &&
      !this.jefePomberito.derrotado &&
      !this.jefePomberito.cayendo;

    const enZonaJefe1 = this.zonaJefe1.update(this.JugadorPrincipal, nahuelitoDisponible);
    const enZonaJefe2 = this.zonaJefe2.update(this.JugadorPrincipal, pomberitoDisponible);

    const interactuar =
      Phaser.Input.Keyboard.JustDown(this.teclaE) ||
      this.botonInteractuarPresionado;

    if (enZonaJefe1 && interactuar) {
      this.iniciarPelea(RIVAL_NAHUELITO_NIVEL);
    }

    if (enZonaJefe2 && interactuar && pomberitoDisponible) {
      this.iniciarPelea(RIVAL_POMBERITO_NIVEL);
    }

    this.botonInteractuarPresionado = false;
  }
}
