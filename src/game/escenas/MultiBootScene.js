import Phaser from 'phaser';

export default class MultiBootScene extends Phaser.Scene {
  constructor() {
    super('MultiBootScene');
  }

  preload() {
    // Sprites del jugador
    this.load.spritesheet('personaje', './assets/sprites/personaje.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('personaje1', './assets/sprites/personaje1.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('personaje2', './assets/sprites/personaje2.png', {
      frameWidth: 64,
      frameHeight: 64,
    });

    // Tilemap de la pulpería (reutilizamos los mismos assets)
    this.load.tilemapTiledJSON('mapaPulperia', './assets/mapa-pulperia/interiorPulperia.json');
    this.load.image('PisoPulperia', './assets/mapa-pulperia/InteriorPulperia.png');
    this.load.image('BarPulperia', './assets/mapa-pulperia/BarPulperia.png');
    this.load.image('ParedesPulperia', './assets/mapa-pulperia/Paredes.png');
    this.load.image('RackPulperia', './assets/mapa-pulperia/RackPulperia.png');

    // Decoración de la pulpería (mismos assets del modo historia)
    this.load.image('alfombra', './assets/mapa-pulperia/alfombra2.png');
    this.load.image('percha', './assets/mapa-pulperia/perchero.png');
    this.load.image('mesa', './assets/mapa-pulperia/mesa.png');
    this.load.image('lena', './assets/mapa-pulperia/lena.png');
    this.load.image('silla1', './assets/mapa-pulperia/silla_costado.png');
    this.load.image('silla2', './assets/mapa-pulperia/silla_frente.png');
    this.load.image('nenaSentada', './assets/mapa-pulperia/nenaSentada.png');
    this.load.image('gaucho', './assets/mapa-pulperia/gauchosentado.png');
    this.load.image('gaucho2', './assets/mapa-pulperia/gauchosentado2.png');
    this.load.image('gaucho3', './assets/mapa-pulperia/gauchosentado3.png');
    this.load.image('ObjetosMesa', './assets/mapa-pulperia/mesa_objetos.png');
    this.load.image('ObjetosMesa2', './assets/mapa-pulperia/mesa_objetos_2.png');

    // Mesas animadas estilo pulpería
    this.load.spritesheet('MesaEspera', './assets/sprites/MesaEspera.png', {
      frameWidth: 256,
      frameHeight: 160,
    });
    this.load.spritesheet('MesaEjemplo', './assets/sprites/GauchoEjemplo.png', {
      frameWidth: 256,
      frameHeight: 160,
    });
    this.load.spritesheet('MesaEjemplo2', './assets/sprites/GauchoEjemplo2.png', {
      frameWidth: 256,
      frameHeight: 160,
    });

    // Objeto mesa y audio
    this.load.image('mesa_juego', './assets/objetos/mesa.png');
    this.load.audio('pasos', './assets/musica/sonidos/paso.ogg');

    // Plugin joystick mobile
    this.load.plugin(
      'rexvirtualjoystickplugin',
      'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js',
      true,
    );
  }

  async create() {
    await document.fonts.load('16px "Jersey 20"');
    await document.fonts.ready;

    const spriteKey = this.registry.get('playerSprite') || 'personaje1';
    this.scene.start('SalaMultijugador', { playerSprite: spriteKey });
  }
}
