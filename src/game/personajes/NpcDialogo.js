import Phaser from 'phaser';
import Npc from '../personajes/Npc.js';
import ZonaInteraccionNpc from '../objetos/ZonaInteraccionNpc.js';

export default class NpcDialogo {
  /**
   * @param {Phaser.Scene} escena
   * @param {number} x
   * @param {number} y
   * @param {string} textura   - clave del spritesheet ya cargado
   * @param {string[]} mensajes
   * @param {Object} [opciones]
   * @param {number} [opciones.escala=1.3]
   * @param {number} [opciones.depth=3]
   */
  constructor(escena, x, y, textura, mensajes, opciones = {}) {
    this.escena = escena;
    this.mensajes = mensajes;
    this.x = x;
    this.y = y;

    const { escala = 1.4, depth = 0 } = opciones;

    this.npc = new Npc(escena, x, y, textura).setDepth(depth).setScale(escala);

    //zona interaccion
    this.zona = new ZonaInteraccionNpc(escena, x, y);

    //estado del dialogo
    this.dialogoAbierto = false;
    this.indice = 0;
    this.globo = null;
    this.textoGlobo = null;
  }

  update(jugador, teclaE, interactuoMobile = false) {
    if (this.dialogoAbierto) {
      if (Phaser.Input.Keyboard.JustDown(teclaE) || interactuoMobile) {
        this._avanzar();
      }
      return;
    }

    const enZona = this.zona.update(jugador);

    if (enZona && (Phaser.Input.Keyboard.JustDown(teclaE) || interactuoMobile)) {
      this._abrir(jugador);
    }
  }

  _abrir(jugador) {
    this.dialogoAbierto = true;
    this.indice = 0;
    jugador.setVelocity(0);
    this._mostrarGlobo(this.mensajes[0]);
    this._onClick = () => this._avanzar();
    this.escena.input.on('pointerdown', this._onClick);
  }

  _avanzar() {
    this.indice++;
    if (this.indice < this.mensajes.length) {
      this.textoGlobo.setText(this.mensajes[this.indice]);
    } else {
      this._cerrar();
    }
  }

  _cerrar() {
    this.dialogoAbierto = false;
    this.indice = 0;
    this.escena.input.off('pointerdown', this._onClick);

    if (this.globo) {
      this.escena.tweens.add({
        targets: this.globo,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          this.globo.destroy();
          this.globo = null;
          this.textoGlobo = null;
        },
      });
    }
  }

  _mostrarGlobo(mensaje) {
    const ancho = 180;
    const alto = 70;
    const pad = 15;

    this.globo = this.escena.add
      .container(this.x, this.y - 70)
      .setDepth(100)
      .setAlpha(0);

    const fondo = this.escena.add.graphics();
    fondo.fillStyle(0xffffff, 0.95).lineStyle(2, 0x2d1910, 1);
    const rx = -(ancho / 2) - pad;
    const ry = -alto - pad;
    const rw = ancho + pad * 2;
    const rh = alto + pad * 2;
    fondo.fillRoundedRect(rx, ry, rw, rh, 8).strokeRoundedRect(rx, ry, rw, rh, 8);
    fondo
      .beginPath()
      .moveTo(-10, ry + rh)
      .lineTo(10, ry + rh)
      .lineTo(0, ry + rh + 10)
      .closePath()
      .fillPath()
      .strokePath();

    this.textoGlobo = this.escena.add
      .text(0, ry + rh / 2, mensaje, {
        fontFamily: "'Jersey 20'",
        fontSize: '18px',
        color: '#2d1910',
        align: 'center',
        wordWrap: { width: ancho },
      })
      .setOrigin(0.5);

    const textoContinuar = this.escena.add
      .text(ancho / 2 + pad - 8, ry + rh - 10, '▼', {
        fontFamily: "'Jersey 20'",
        fontSize: '12px',
        color: '#573a04',
      })
      .setOrigin(0.5);

    this.escena.tweens.add({
      targets: textoContinuar,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.globo.add([fondo, this.textoGlobo, textoContinuar]);

    this.escena.tweens.add({ targets: this.globo, alpha: 1, duration: 200 });
  }
}