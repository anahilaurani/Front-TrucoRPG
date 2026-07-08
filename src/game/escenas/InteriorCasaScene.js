import JugadorPrincipal from '../personajes/JugadorPrincipal.js';
import BaseScene from './BaseScene.js';
import PuntoInteraccion from '../objetos/PuntoInteraccion.js';
import Portal from '../objetos/Portal.js';

export default class InteriorCasaScene extends BaseScene {
  constructor() {
    super('InteriorCasaScene');
    this.onCambiarSkin = null;
  }

  init(data) {
    this.playerKey = this.registry.get('playerSprite') || data.playerSprite || 'personaje';
    this.startX = data.x || 85;
    this.startY = data.y || 470;
  }

  preload() {
    this.load.spritesheet('baul_spritesheet', '/assets/sprites/baul_spritesheet.png', {
      frameWidth: 128,
      frameHeight: 160,
    });
  }

  create() {
    this.botonPantallaCompleta();
    this.crearControlesMobile();
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    if (!this.anims.exists('abrir_baul')) {
      this.anims.create({
        key: 'abrir_baul',
        frames: this.anims.generateFrameNumbers('baul_spritesheet', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: 0,
      });
    }
    if (!this.anims.exists('cerrar_baul')) {
      this.anims.create({
        key: 'cerrar_baul',
        frames: this.anims.generateFrameNumbers('baul_spritesheet', { start: 5, end: 0 }),
        frameRate: 14,
        repeat: 0,
      });
    }

    const map = this.make.tilemap({ key: 'mapa-casa' });
    const paredesTileset = map.addTilesetImage('Paredes', 'ParedesCasa');
    const interiorCasaTileset = map.addTilesetImage('InteriorCasa', 'InteriorCasa');

    map.createLayer('Base', interiorCasaTileset);
    map.createLayer('Paredes', paredesTileset);
    map.createLayer('Marco', paredesTileset);
    map.createLayer('Muebles', interiorCasaTileset);
    map.createLayer('Muebles2', interiorCasaTileset);
    const colisiones = map.createLayer('Colisiones', paredesTileset);
    colisiones.setCollisionByExclusion([-1]);

    this.JugadorPrincipal = new JugadorPrincipal(
      this,
      this.startX,
      this.startY,
      this.playerKey,
    ).setDepth(1);

    this.JugadorPrincipal.setCollideWorldBounds(true);
    this.physics.add.collider(this.JugadorPrincipal, colisiones);
    this.JugadorPrincipal.setScale(2.5);

    this.keys = this.input.keyboard.createCursorKeys();
    this.teclaE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.onCambiarSkin = (evento) => {
      const nuevaSkin = evento.detail;

     
      if (!this.textures.exists(nuevaSkin)) {
        console.error(`🚨 La skin de Phaser '${nuevaSkin}' no se encuentra cargada en la caché de texturas. Revisá HistoriaBootScene.`);
        return;
      }

      if (this.JugadorPrincipal && this.JugadorPrincipal.active) {
        this.JugadorPrincipal.setTexture(nuevaSkin);
        this.playerKey = nuevaSkin;

        if (this.JugadorPrincipal.anims && this.JugadorPrincipal.anims.isPlaying) {
          this.JugadorPrincipal.anims.stop();
        }

        console.log("¡Skin cambiada en tiempo real sin recargar! Nueva key:", nuevaSkin);
      }
    };

    window.addEventListener('phaser:cambiarSkin', this.onCambiarSkin);

    this.puntosDeInteraccion = [];

    this.puntosDeInteraccion.push(
      new PuntoInteraccion(this, 1025, 190, 'inventario', 'baul_spritesheet', 0.8, {
        animAbrir: 'abrir_baul',
        animCerrar: 'cerrar_baul',
      }),
    );

    this.puntosDeInteraccion.push(new PuntoInteraccion(this, 247, 224, 'armario', false, {}));
    this.puntosDeInteraccion.push(new PuntoInteraccion(this, 703, 192, 'logros', false, {}));

    this.salirAfuera = new Portal(this, 644, 656, 'MapaPrincipal', false, { x: 444, y: 195 });
    this.physics.add.overlap(this.JugadorPrincipal, this.salirAfuera.zone);

    this.events.once('shutdown', () => {
      window.removeEventListener('phaser:cambiarSkin', this.onCambiarSkin);
      console.log("Listener 'phaser:cambiarSkin' removido con éxito.");
    });
  }

  update() {
    this.JugadorPrincipal.update(this.keys, this.teclaE);

    const interactuoMobile = this.botonInteractuarPresionado;

    this.puntosDeInteraccion.forEach((punto) => {
      punto.update(this.JugadorPrincipal, this.teclaE, interactuoMobile);
    });

    this.salirAfuera.update(this.JugadorPrincipal, this.teclaE, interactuoMobile);

    this.botonInteractuarPresionado = false;
  }
}