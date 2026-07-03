import Phaser from 'phaser';

export default class GauchosPulperia extends Phaser.Physics.Arcade.Sprite {
  constructor(escena, x, y, nombre) {
    super(escena, x, y, nombre);

    this.nombre = nombre;
    escena.add.existing(this);
    escena.physics.add.existing(this);

    this.setScale(1.1);
    this.body.setAllowGravity(false);

    if (!escena.anims.exists(`${this.nombre}-quieto`)) {
      escena.anims.create({
        key: `${this.nombre}-quieto`,
        frames: escena.anims.generateFrameNumbers(this.nombre, { start: 0, end: 4 }),
        frameRate: 6,
        repeat: -1,
      });
    }

    const retrasoAleatorio = Phaser.Math.Between(0, 2000);

    this.anims.play({
      key: `${this.nombre}-quieto`,
      delay: retrasoAleatorio
    }, true);
  }

  update(keys) {}
}