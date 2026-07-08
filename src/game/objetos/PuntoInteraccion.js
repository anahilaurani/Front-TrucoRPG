import Phaser from 'phaser';

export default class PuntoInteraccion {
  /**
   * @param {Phaser.Scene} escena
   * @param {number} x
   * @param {number} y
   * @param {string} tipoVista
   * @param {string|null|undefined} texturaSprite
   * @param {number|null|undefined} scaleTextura
   * @param {Object|undefined} datosExtra
   */
  constructor(escena, x, y, tipoVista, texturaSprite, scaleTextura = 1, datosExtra = {}) {
    this.escena = escena;
    this.tipoVista = tipoVista;
    this.scaleTextura = scaleTextura;
    this.datosExtra = datosExtra;
    this.cercaDelObjeto = false;
    this.interactuando = false;

    if (
      typeof texturaSprite === 'string' &&
      texturaSprite.trim() !== '' &&
      texturaSprite !== 'false'
    ) {
      this.sprite = this.escena.add.sprite(x, y, texturaSprite).setScale(scaleTextura).setDepth(0);
    }

    this.zone = this.escena.add.zone(x, y, 24, 24);
    this.escena.physics.add.existing(this.zone);
    this.zone.body.setSize(16, 16);
    this.zone.body.setAllowGravity(false);
    this.zone.body.moves = false;

    this.textoE = this.escena.add
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

    window.addEventListener('resume-game', () => {
      if (this.escena && this.escena.physics.world) {
        this.escena.physics.world.resume();
      }

      if (this.interactuando) {
        if (this.sprite && this.datosExtra && this.datosExtra.animCerrar) {
          this.sprite.play(this.datosExtra.animCerrar);
          this.sprite.once('animationcomplete', () => {
            this.interactuando = false;
          });
        } else {
          this.interactuando = false;
        }
      }
    });
  }

  update(jugador, teclaE, interactuoMobile = false) {
    if (!jugador || !jugador.body) return;

    const enZona = this.escena.physics.overlap(jugador, this.zone);

    if (this.interactuando) {
      this.textoE.setVisible(false);
      return;
    }

    if (enZona && !this.cercaDelObjeto) {
      this.cercaDelObjeto = true;
      this.textoE.setVisible(true);
    }

    if (enZona) {
      this.textoE.x = jugador.x;
      this.textoE.y = jugador.y - 55;

      const quiereInteractuar = Phaser.Input.Keyboard.JustDown(teclaE) || interactuoMobile;

      if (quiereInteractuar) {
        this.interactuando = true;
        jugador.setVelocity(0);

        if (this.sprite && this.datosExtra && this.datosExtra.animAbrir) {
          this.sprite.play(this.datosExtra.animAbrir);

          this.sprite.once('animationcomplete', () => {
            this.enviarEventoInteraccion();
          });
        } else {
          this.enviarEventoInteraccion();
        }
      }
    } else {
      if (this.cercaDelObjeto) {
        this.cercaDelObjeto = false;
        this.textoE.setVisible(false);
      }
    }
  }

  enviarEventoInteraccion() {
    this.escena.physics.world.pause();

    const eventoUi = new CustomEvent('game-interact', {
      detail: {
        vista: this.tipoVista,
        datos: this.datosExtra,
      },
    });
    window.dispatchEvent(eventoUi);
  }
}
