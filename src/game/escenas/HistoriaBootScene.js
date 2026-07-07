import Phaser from 'phaser';
export default class HistoriaBootScene extends Phaser.Scene {
  constructor() {
    super('HistoriaBootScene');
  }

  preload() {
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
    this.load.spritesheet('personaje3', './assets/sprites/personaje3.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('personaje1rosa', './assets/sprites/personaje1rosa.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('personaje1marron', './assets/sprites/personaje1marron.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('personaje1azul', './assets/sprites/personaje1azul.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('personaje1rojo', './assets/sprites/personaje1rojo.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('personaje2rosa', './assets/sprites/personaje2rosa.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('personaje2rojo', './assets/sprites/personaje2rojo.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('personaje2marron', './assets/sprites/personaje2marron.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('personaje2azul', './assets/sprites/personaje2azul.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('personaje3rosa', './assets/sprites/personaje3rosa.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('personaje3marron', './assets/sprites/personaje3marron.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('personaje3azul', './assets/sprites/personaje3azul.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('personaje3rojo', './assets/sprites/personaje3rojo.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('Nuri', './assets/sprites/Nuri.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('Facu', './assets/sprites/Facu.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('Ale', './assets/sprites/Ale.png', {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.tilemapTiledJSON('mapa', './assets/mapa-principal/mapa-principal.json');

    this.load.tilemapTiledJSON('mapa', './assets/mapa-principal/mapa-principal.json');

    //mapa lobby
    this.load.image('Arbol 1', './assets/mapa-principal/Arbol1.png');
    this.load.image('Arbol 2', './assets/mapa-principal/Arbol2.png');
    this.load.image('Arbol 3', './assets/mapa-principal/Arbol3.png');
    this.load.image('Fuego', './assets/mapa-principal/Fogata.png');
    this.load.image('Gallinas', './assets/mapa-principal/Gallinitas.png');
    this.load.image('Mate', './assets/mapa-principal/mate.png');
    this.load.image('Paredes', './assets/mapa-principal/Paredes.png');
    this.load.image('Partes', './assets/mapa-principal/Partes.png');
    this.load.image('Pava', './assets/mapa-principal/pavita.png');
    this.load.image('Piedras', './assets/mapa-principal/Piedras.png');
    this.load.image('Piso 2', './assets/mapa-principal/Camino.png');
    this.load.image('Techos', './assets/mapa-principal/Techos.png');
    this.load.image('Vegetacion', './assets/mapa-principal/Vegetacion.png');
    this.load.image('Pulperia', './assets/mapa-principal/Pulperia.png');

    //mapa pulperia
    this.load.tilemapTiledJSON('mapaPulperia', './assets/mapa-pulperia/interiorPulperia.json');
    this.load.image('PisoPulperia', './assets/mapa-pulperia/InteriorPulperia.png');
    this.load.image('BarPulperia', './assets/mapa-pulperia/BarPulperia.png');
    this.load.image('ParedesPulperia', './assets/mapa-pulperia/Paredes.png');
    this.load.image('PartesPulperia', './assets/mapa-pulperia/Partes.png');
    this.load.image('RackPulperia', './assets/mapa-pulperia/RackPulperia.png');
    this.load.image('alfombra', './assets/mapa-pulperia/alfombra2.png');
    this.load.image('percha', './assets/mapa-pulperia/perchero.png');
    this.load.image('mesa', './assets/mapa-pulperia/mesa.png');
    this.load.image('lena', './assets/mapa-pulperia/lena.png');
    this.load.image('silla1', './assets/mapa-pulperia/silla_costado.png');
    this.load.image('silla2', './assets/mapa-pulperia/silla_frente.png');

    //mapa casa
    this.load.image('InteriorCasa', './assets/mapa-casa/InteriorCasa.png');
    this.load.image('ParedesCasa', './assets/mapa-casa/Paredes.png');
    this.load.tilemapTiledJSON('mapa-casa', './assets/mapa-casa/InteriorCasa.json');
    this.load.image('cartel', './assets/mapa-principal/Cartel.png');

    //mapa aventura 1
    this.load.tilemapTiledJSON('mapa-aventura-1', './assets/mapa-aventura-1/mapa-aventura-1.json');

    this.load.image('Agua', './assets/mapa-aventura-1/Agua.png');
    this.load.image('Arbol 1 Av', './assets/mapa-aventura-1/Arbol1.png');
    this.load.image('Arbol 2 Av', './assets/mapa-aventura-1/Arbol2.png');
    this.load.image('Arbol 3 Av', './assets/mapa-aventura-1/Arbol3.png');
    this.load.image('Suelo', './assets/mapa-aventura-1/Camino.png');
    this.load.image('Fuego Av', './assets/mapa-aventura-1/Fogata.png');
    this.load.image('ParedesCueva', './assets/mapa-aventura-1/ParedesCueva.png');
    this.load.image('ParedesMontaña', './assets/mapa-aventura-1/ParedesMontaña.png');
    this.load.image('Piedras Av', './assets/mapa-aventura-1/Piedras.png');
    this.load.image('Vegetacion Av', './assets/mapa-aventura-1/Vegetacion.png');
    this.load.image('Cueva Av', './assets/mapa-aventura-1/Cueva.png');

    //mapa aventura 2
    this.load.tilemapTiledJSON('mapa-aventura-2', './assets/mapa-aventura-2/mapa-aventura-2.json');
    this.load.image('Cueva Av2', './assets/mapa-aventura-2/Cueva.png');
    this.load.image('CuevaDecoracion Av2', './assets/mapa-aventura-2/CuevaDecoracion.png');

    //mapa aventura 3
    this.load.tilemapTiledJSON('mapa-aventura-3', './assets/mapa-aventura-3/mapa-aventura-3.json');
    this.load.image('Cueva Av3', './assets/mapa-aventura-3/Cueva.png');
    this.load.image('CuevaDecoracion Av3', './assets/mapa-aventura-3/CuevaDecoracion.png');
    this.load.image('Trono Av3', './assets/mapa-aventura-3/Trono.png');

    this.load.plugin(
      'rexvirtualjoystickplugin',
      'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js',
      true,
    );
  }

  async create() {
    await document.fonts.load('16px "Jersey 20"');
    await document.fonts.ready;

    const dummy = this.add.text(0, 0, ' ', {
      fontFamily: 'Jersey 20',
    });
    dummy.setVisible(false);

    let personajeFinal = this.registry.get('playerSprite') || 'personaje1';

    this.registry.set('playerSprite', personajeFinal);

    this.scene.start('MapaPrincipal', { playerSprite: personajeFinal });
  }
}
