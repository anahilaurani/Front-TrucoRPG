import Phaser from 'phaser';

// Barrera de pinches de piedra (estilo cueva) que bloquea el paso hasta
// derrotar a un jefe. Misma mecánica que BarreraJefe: se crea bloqueada.
// Desbloqueos posibles:
//  - desbloquear(): los pinches se hunden en el piso.
//  - desbloquearConFuego(): los pinches se prenden fuego y se queman.
// opciones: { horizontal: true } arma la fila de pinches a lo ancho
// (para tapar puertas) en vez de en columna.
export default class BarreraPinches {
  constructor(escena, x, y, largo, mensaje, opciones = {}) {
    this.escena = escena;
    this.x = x;
    this.y = y;
    this.horizontal = !!opciones.horizontal;
    this.desbloqueada = false;
    this.animando = false;

    // paleta de la cueva: piedra oscura con caras iluminadas y cristales
    const PIEDRA_OSCURA = 0x2e3138;
    const PIEDRA_MEDIA = 0x4d525c;
    const PIEDRA_CLARA = 0x7d848f;
    const BORDE = 0x1a1c21;
    const CRISTAL = 0x6fd3cf;

    this.contenedor = escena.add.container(x, y).setDepth(1);
    this.piezas = [];
    this.pinchos = []; // solo los triángulos grandes (para el fuego)

    // fila/columna de pinches: triángulos alternados para dar volumen
    const paso = 22;
    const cantidad = Math.floor(largo / paso);
    for (let i = 0; i < cantidad; i++) {
      const a = -largo / 2 + paso / 2 + i * paso; // avance sobre el eje principal
      const off = i % 2 === 0 ? -6 : 6; // desfase sobre el eje secundario
      const px = this.horizontal ? a : off;
      const py = this.horizontal ? off : a;
      const alt = Phaser.Math.Between(26, 34);
      const ancho = Phaser.Math.Between(16, 20);

      // cara oscura (todo el pincho)
      const pincho = escena.add
        .triangle(px, py, 0, 0, ancho, 0, ancho / 2, -alt, PIEDRA_MEDIA)
        .setStrokeStyle(2, BORDE);
      // cara iluminada (mitad izquierda, luz desde arriba-izquierda)
      const cara = escena.add.triangle(
        px - ancho / 4, py, 0, 0, ancho / 2, 0, ancho / 2, -alt, PIEDRA_CLARA,
      );
      // base rocosa
      const base = escena.add
        .ellipse(px, py + 2, ancho + 8, 10, PIEDRA_OSCURA)
        .setStrokeStyle(2, BORDE);

      this.contenedor.add([base, pincho, cara]);
      this.piezas.push(base, pincho, cara);
      this.pinchos.push({ x: px, y: py, alto: alt, cuerpo: pincho, cara });
    }

    // un par de cristales chicos como los de la cueva
    const c1 = this.horizontal ? { x: -largo / 2 + 6, y: 8 } : { x: -14, y: largo / 2 - 8 };
    const c2 = this.horizontal ? { x: largo / 2 - 6, y: 6 } : { x: 13, y: -largo / 2 + 14 };
    const cristal1 = escena.add
      .triangle(c1.x, c1.y, 0, 0, 8, 0, 4, -12, CRISTAL)
      .setStrokeStyle(1, BORDE)
      .setAlpha(0.9);
    const cristal2 = escena.add
      .triangle(c2.x, c2.y, 0, 0, 7, 0, 3.5, -10, CRISTAL)
      .setStrokeStyle(1, BORDE)
      .setAlpha(0.9);
    this.contenedor.add([cristal1, cristal2]);
    this.piezas.push(cristal1, cristal2);

    // cartel de aviso
    const cartelY = this.horizontal ? y - 36 : y - largo / 2 - 18;
    this.cartel = escena.add
      .text(x, cartelY, mensaje, {
        fontFamily: '"Jersey 10"',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#573a04',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(10);

    // cuerpo físico invisible que bloquea el paso
    const anchoFisico = this.horizontal ? largo : 26;
    const altoFisico = this.horizontal ? 26 : largo;
    this.bloqueo = escena.add.rectangle(x, y, anchoFisico, altoFisico, 0x000000, 0);
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

  // Libera el paso con animación: los pinches se hunden en el piso.
  desbloquear(jugador) {
    this._iniciarDesbloqueo(jugador, () => this._animarHundimiento(jugador));
  }

  // Libera el paso con animación: los pinches se prenden fuego y se queman.
  desbloquearConFuego(jugador) {
    this._iniciarDesbloqueo(jugador, () => this._animarFuego(jugador));
  }

  _iniciarDesbloqueo(jugador, animacion) {
    if (this.desbloqueada || this.animando) return;
    this.desbloqueada = true;
    this.animando = true;

    const cam = this.escena.cameras.main;
    cam.stopFollow();
    cam.pan(this.x, this.y, 700, 'Sine.easeInOut', false, (camera, progress) => {
      if (progress === 1) animacion();
    });
  }

  _animarHundimiento(jugador) {
    this.escena.cameras.main.shake(300, 0.005);
    this.cartel.destroy();
    this._destruirFisica();

    this.escena.tweens.add({
      targets: this.piezas,
      y: '+=26',
      scaleY: 0.05,
      alpha: 0,
      duration: 550,
      ease: 'Cubic.easeIn',
      delay: this.escena.tweens.stagger(45),
      onComplete: () => {
        this.contenedor.destroy();
        this._volverAlJugador(jugador);
      },
    });
  }

  _animarFuego(jugador) {
    const escena = this.escena;
    this.cartel.destroy();
    this._destruirFisica();

    // llamas sobre cada pincho: dos triángulos (naranja afuera, amarillo adentro)
    const llamas = [];
    this.pinchos.forEach((p, i) => {
      escena.time.delayedCall(i * 90, () => {
        const llamaExt = escena.add
          .triangle(p.x, p.y - p.alto + 6, 0, 0, 14, 0, 7, -20, 0xff7a2f)
          .setAlpha(0);
        const llamaInt = escena.add
          .triangle(p.x, p.y - p.alto + 6, 0, 0, 8, 0, 4, -12, 0xffd23f)
          .setAlpha(0);
        this.contenedor.add([llamaExt, llamaInt]);
        llamas.push(llamaExt, llamaInt);

        // el pincho se va carbonizando
        p.cuerpo.setFillStyle(0x241f1c);
        p.cara.setFillStyle(0x3a2f28);

        // parpadeo de la llama
        escena.tweens.add({
          targets: [llamaExt, llamaInt],
          alpha: 1,
          scaleY: { from: 0.6, to: 1.15 },
          duration: 160,
          yoyo: true,
          repeat: 5,
          ease: 'Sine.easeInOut',
        });
      });
    });

    escena.cameras.main.shake(250, 0.003);

    // después de arder un rato, todo se consume
    const arder = this.pinchos.length * 90 + 900;
    escena.time.delayedCall(arder, () => {
      escena.tweens.add({
        targets: [...this.piezas, ...llamas],
        alpha: 0,
        scaleY: 0.05,
        y: '+=10',
        duration: 650,
        ease: 'Cubic.easeIn',
        delay: escena.tweens.stagger(35),
        onComplete: () => {
          this.contenedor.destroy();
          this._volverAlJugador(jugador);
        },
      });
    });
  }

  _volverAlJugador(jugador) {
    const cam = this.escena.cameras.main;
    this.escena.time.delayedCall(300, () => {
      cam.pan(jugador.x, jugador.y, 700, 'Sine.easeInOut', false, (camera, progress) => {
        if (progress === 1) {
          cam.startFollow(jugador, true, 0.1, 0.1);
          this.animando = false;
        }
      });
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
