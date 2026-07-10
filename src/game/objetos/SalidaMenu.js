import Phaser from 'phaser';

/**
 * Zona de salida al menú: cuando el jugador está encima y aprieta E
 * (o el botón de interactuar en mobile), muestra un cartel de
 * confirmación "¿Deseás salir al menú?" con Sí / No.
 * Al confirmar, dispara el evento 'historia:exit' que Angular escucha
 * para navegar de vuelta al menú.
 */
export default class SalidaMenu {
  constructor(escena, x, y, ancho = 40, alto = 140) {
    this.escena = escena;
    this.abierto = false;
    this.cerca = false;
    this.saliendo = false;

    this.zone = escena.add.zone(x, y, ancho, alto);
    escena.physics.add.existing(this.zone);
    this.zone.body.setAllowGravity(false);
    this.zone.body.moves = false;

    this.textoE = escena.add
      .text(x, y - 50, ' E  Salir al menú ', {
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

  update(jugador, teclaE, botonMobilePresionado = false) {
    if (this.abierto || this.saliendo) return;

    const enZona = this.escena.physics.overlap(jugador, this.zone);

    if (enZona !== this.cerca) {
      this.cerca = enZona;
      this.textoE.setVisible(enZona);
    }

    if (enZona) {
      this.textoE.x = jugador.x;
      this.textoE.y = jugador.y - 55;

      if (Phaser.Input.Keyboard.JustDown(teclaE) || botonMobilePresionado) {
        this.abrirConfirmacion(jugador);
      }
    }
  }

  abrirConfirmacion(jugador) {
    this.abierto = true;
    jugador.setVelocity(0);

    const cam = this.escena.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;

    const overlay = this.escena.add
      .rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.6)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive(); // bloquea clicks al mapa

    const panel = this.escena.add
      .rectangle(cx, cy, 360, 160, 0x1c1206, 0.96)
      .setStrokeStyle(2, 0x6a4a20)
      .setScrollFactor(0)
      .setDepth(101);

    const pregunta = this.escena.add
      .text(cx, cy - 38, '¿Deseás salir al menú?', {
        fontFamily: '"Jersey 10"',
        fontSize: '24px',
        color: '#e8aa40',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);

    const estiloBtn = {
      fontFamily: '"Jersey 10"',
      fontSize: '20px',
      padding: { x: 22, y: 8 },
    };

    const btnSi = this.escena.add
      .text(cx - 70, cy + 30, 'Sí', {
        ...estiloBtn,
        color: '#ee6666',
        backgroundColor: '#3a1010',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101)
      .setInteractive({ useHandCursor: true });

    const btnNo = this.escena.add
      .text(cx + 70, cy + 30, 'No', {
        ...estiloBtn,
        color: '#c89030',
        backgroundColor: '#2a2010',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101)
      .setInteractive({ useHandCursor: true });

    btnSi.on('pointerover', () => btnSi.setBackgroundColor('#551818'));
    btnSi.on('pointerout', () => btnSi.setBackgroundColor('#3a1010'));
    btnNo.on('pointerover', () => btnNo.setBackgroundColor('#3a2c14'));
    btnNo.on('pointerout', () => btnNo.setBackgroundColor('#2a2010'));

    btnSi.on('pointerdown', () => this.confirmarSalida());
    btnNo.on('pointerdown', () => this.cerrar());

    this.ui = [overlay, panel, pregunta, btnSi, btnNo];
  }

  cerrar() {
    this.abierto = false;
    if (this.ui) {
      this.ui.forEach((el) => el.destroy());
      this.ui = null;
    }
  }

  confirmarSalida() {
    if (this.saliendo) return;
    this.saliendo = true;
    this.cerrar();
    this.escena.cameras.main.fadeOut(400, 0, 0, 0);
    this.escena.time.delayedCall(420, () => {
      window.dispatchEvent(new CustomEvent('historia:exit'));
    });
  }
}
