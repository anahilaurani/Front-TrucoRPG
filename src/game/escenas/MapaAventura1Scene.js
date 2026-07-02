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
        `/api/historia/rivales/${RIVAL_POMBERITO_NIVEL}/puede-pelear`,
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
        `/api/historia/rivales/${RIVAL_SIGUIENTE_A_POMBERITO_NIVEL}/puede-pelear`,
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
