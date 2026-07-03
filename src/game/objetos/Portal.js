import Phaser from 'phaser';

export default class Portal {
  constructor(escena, x, y, proximaEscena, texturaSprite, datosDestino = {}) {
    this.escena = escena;
    this.sceneManager = escena.scene;
    this.proximaEscena = proximaEscena;
    this.cercaDelPortal = false;
    this.datosDestino = datosDestino;
    this.mensajeBloqueo = 'Todavía no podés pasar';

    if (texturaSprite && texturaSprite !== 'false') {
      this.sprite = this.escena.add
        .image(x, y, texturaSprite)
        .setScale(0.8)
        .setDepth(0)
        .setVisible(true);
    } else {
      this.sprite = null;
    }

    this.zone = this.escena.add.zone(x, y, 16, 16);
    escena.physics.add.existing(this.zone);
    this.zone.body.setSize(10, 10);
    this.zone.body.setAllowGravity(false);
    this.zone.body.moves = false;

    this.textoE = escena.add
      .text(x, y - 50, ' E ', {
        fontFamily: '"Jersey 20"',
        fontSize: '18px', 
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#573a04',
        stroke: '#000000',
        strokeThickness: 4,
        padding: { x: 6, y: 4 },
        shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, stroke: true, fill: true },
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setVisible(false);
  }

  update(jugador, teclaE, botonMobilePresionado = false, habilitado = true) {
    const enZona = this.escena.physics.overlap(jugador, this.zone);

    if (enZona && !this.cercaDelPortal) {
      this.cercaDelPortal = true;
      this.textoE.setVisible(true);
    }

    if (enZona) {
      this.textoE.setText(habilitado ? ' E ' : this.mensajeBloqueo);
      this.textoE.x = jugador.x;
      this.textoE.y = jugador.y - 55;

      const quiereInteractuar = Phaser.Input.Keyboard.JustDown(teclaE) || botonMobilePresionado;

      if (quiereInteractuar && habilitado) {
        jugador.setVelocity(0);

        this.escena.cameras.main.fadeOut(1000, 0, 0, 0, (camera, progress) => {
          if (progress === 1) {
            this.sceneManager.start(this.proximaEscena, {
              playerSprite: jugador.texture.key,
              x: this.datosDestino.x || 85,
              y: this.datosDestino.y || 470,
            });
          }
        });
      }
    } else {
      if (this.cercaDelPortal) {
        this.cercaDelPortal = false;
        this.textoE.setVisible(false);
      }
    }
  }
}
