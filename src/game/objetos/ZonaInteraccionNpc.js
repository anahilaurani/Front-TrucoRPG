import Phaser from 'phaser';

const ANCHO_ZONA = 120;
const ALTO_ZONA = 56;

export default class ZonaInteraccionNpc {
  constructor(escena, x, y, ancho = ANCHO_ZONA, alto = ALTO_ZONA) {
    this.escena = escena;
    this.cercaDelNpc = false;

    this.zone = escena.add.zone(x, y, ancho, alto);
    escena.physics.add.existing(this.zone);
    this.zone.body.setAllowGravity(false);
    this.zone.body.moves = false;

    this.textoE = escena.add
      .text(x, y - 50, 'E', {
        fontFamily: '"Jersey 10"',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#573a04',
        stroke: '#000000',
        strokeThickness: 3,
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setVisible(false);
  }

  update(jugador, activo = true) {
    const enZona = this.escena.physics.overlap(jugador, this.zone);
    const mostrarIndicador = enZona && activo;

    if (mostrarIndicador && !this.cercaDelNpc) {
      this.cercaDelNpc = true;
      this.textoE.setVisible(true);
    }

    if (mostrarIndicador) {
      this.textoE.x = jugador.x;
      this.textoE.y = jugador.y - 45;
    } else if (this.cercaDelNpc) {
      this.cercaDelNpc = false;
      this.textoE.setVisible(false);
    }

    return enZona && activo;
  }
}
