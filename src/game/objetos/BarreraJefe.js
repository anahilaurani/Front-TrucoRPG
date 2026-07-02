import Phaser from 'phaser';

// Barrera de troncos que bloquea el paso hasta derrotar a un jefe.
// Se crea bloqueada; desbloquear() reproduce una animación (la cámara
// panea hasta la barrera, los troncos caen y se desvanecen) y libera el paso.
export default class BarreraJefe {
  constructor(escena, x, y, alto, mensaje) {
    this.escena = escena;
    this.x = x;
    this.y = y;
    this.desbloqueada = false;
    this.animando = false;

    // troncos apilados
    this.contenedor = escena.add.container(x, y).setDepth(1);
    this.piezas = [];

    const cantidadTroncos = Math.floor(alto / 32);
    for (let i = 0; i < cantidadTroncos; i++) {
      const py = -alto / 2 + 16 + i * 32;
      const color = i % 2 === 0 ? 0x6b4a2b : 0x59391f;
      const tronco = escena.add
        .rectangle(0, py, 20, 30, color)
        .setStrokeStyle(2, 0x3a2413);
      this.contenedor.add(tronco);
      this.piezas.push(tronco);
    }

    // travesaños verticales
    const travesanio1 = escena.add.rectangle(-8, 0, 5, alto - 6, 0x8a5a33);
    const travesanio2 = escena.add.rectangle(8, 0, 5, alto - 6, 0x8a5a33);
    this.contenedor.add([travesanio1, travesanio2]);
    this.piezas.push(travesanio1, travesanio2);

    // cartel de aviso
    this.cartel = escena.add
      .text(x, y - alto / 2 - 18, mensaje, {
        fontFamily: '"Jersey 10"',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#573a04',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(10);

    // cuerpo físico invisible que bloquea el paso
    this.bloqueo = escena.add.rectangle(x, y, 20, alto, 0x000000, 0);
    escena.physics.add.existing(this.bloqueo, true);
  }

  agregarColision(jugador) {
    this.collider = this.escena.physics.add.collider(jugador, this.bloqueo);
  }

  // Libera el paso sin animación (para cuando el jefe ya estaba derrotado).
  desbloquearInmediato() {
    if (this.desbloqueada) return;
    this.desbloqueada = true;
    this._destruirFisica();
    this.contenedor.destroy();
    this.cartel.destroy();
  }

  // Libera el paso con animación de desbloqueo.
  desbloquear(jugador) {
    if (this.desbloqueada || this.animando) return;
    this.desbloqueada = true;
    this.animando = true;

    const cam = this.escena.cameras.main;
    cam.stopFollow();
    cam.pan(this.x, this.y, 700, 'Sine.easeInOut', false, (camera, progress) => {
      if (progress === 1) this._animarCaida(jugador);
    });
  }

  _animarCaida(jugador) {
    const cam = this.escena.cameras.main;
    cam.shake(250, 0.004);
    this.cartel.destroy();
    this._destruirFisica();

    this.escena.tweens.add({
      targets: this.piezas,
      y: '+=60',
      angle: () => Phaser.Math.Between(-35, 35),
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeIn',
      delay: this.escena.tweens.stagger(60),
      onComplete: () => {
        this.contenedor.destroy();
        this.escena.time.delayedCall(300, () => {
          cam.pan(jugador.x, jugador.y, 700, 'Sine.easeInOut', false, (camera, progress) => {
            if (progress === 1) {
              cam.startFollow(jugador, true, 0.1, 0.1);
              this.animando = false;
            }
          });
        });
      },
    });
  }

  _destruirFisica() {
    if (this.collider) {
      this.collider.destroy();
      this.collider = null;
    }
    if (this.bloqueo) {
      this.bloqueo.destroy();
      this.bloqueo = null;
    }
  }
}
