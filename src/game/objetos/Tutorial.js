import Phaser from 'phaser';

export default class Tutorial {
  /**
   * @param {Phaser.Scene} escena
   * @param {string} idTutorial
   * @param {Array<Object>} pasos
   */
  constructor(escena, idTutorial, pasos) {
    this.escena = escena;
    this.idTutorial = idTutorial;
    this.pasos = pasos;
    this.pasoActual = 0;
    this.activo = false;

    this.yaVisto = localStorage.getItem(this.idTutorial) === 'true';
  }

  iniciar() {
    if (this.yaVisto) return false;

    this.activo = true;
    this.pasoActual = 0;
    this.subPasoCamaraPresentado = false;

    if (this.escena.JugadorPrincipal && this.escena.JugadorPrincipal.body) {
      this.escena.JugadorPrincipal.setVelocity(0);
    }

    this.ejecutarPaso();

    this.escena.input.on('pointerdown', () => this.avanzar());
    this.teclaEspacio = this.escena.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    return true;
  }

  update() {
    if (!this.activo) return;

    if (this.escena.JugadorPrincipal) {
      this.escena.JugadorPrincipal.update(
        {
          left: { isDown: false },
          right: { isDown: false },
          up: { isDown: false },
          down: { isDown: false },
        },
        this.escena.teclaE,
      );
    }

    const paso = this.pasos[this.pasoActual];
    if (this.globoContenedor && paso && paso.enfoqueNpc) {
      this.globoContenedor.x = paso.enfoqueNpc.x;
      this.globoContenedor.y = paso.enfoqueNpc.y - 60;
    }

    if (Phaser.Input.Keyboard.JustDown(this.teclaEspacio)) {
      this.avanzar();
    }
  }

  ejecutarPaso() {
    const paso = this.pasos[this.pasoActual];
    const camara = this.escena.cameras.main;

    if (!paso) return;

    if (paso.texto) {
      if (!this.globoContenedor) {
        this.crearGloboTexto(
          paso.enfoqueNpc || {
            x: camara.midPoint.x,
            y: camara.midPoint.y + 60,
          },
          paso.texto,
        );
      } else {
        this.globoContenedor.setVisible(true);
        this.textoGlobo.setText(paso.texto);
      }
    }

    this.subPasoCamaraPresentado = false;

    if (!paso.texto && paso.camaraDestino) {
      this.moverCamaraHaciaObjetivo(paso);
    }

    if (paso.seguirJugador) {
      this.regresarCamaraOriginal();
    }
  }

  avanzar() {
    if (!this.activo) return;

    const paso = this.pasos[this.pasoActual];

    if (paso && paso.camaraDestino && !this.subPasoCamaraPresentado) {
      this.moverCamaraHaciaObjetivo(paso);
      return;
    }

    if (paso && paso.camaraDestino && this.subPasoCamaraPresentado) {
      if (this.globoContenedor) this.globoContenedor.setVisible(false);

      this.regresarCamaraOriginal(() => {
        this.irAlSiguientePaso();
      });
      return;
    }

    this.irAlSiguientePaso();
  }

  irAlSiguientePaso() {
    this.pasoActual++;
    if (this.pasoActual < this.pasos.length) {
      this.ejecutarPaso();
    } else {
      this.finalizar();
    }
  }

  moverCamaraHaciaObjetivo(paso) {
    this.escena.game.canvas.style.imageRendering = 'pixelated';
    const camara = this.escena.cameras.main;
    this.camaraEstabaSiguiendo = camara._follow;
    camara.stopFollow();

    this.subPasoCamaraPresentado = true;

    if (this.globoContenedor) this.globoContenedor.setVisible(false);

    camara.pan(paso.camaraDestino.x, paso.camaraDestino.y, paso.camaraTiempo || 1200, 'Power2');
    camara.zoomTo(paso.camaraZoom || 1.5, paso.camaraTiempo || 1200, 'Power2');
  }

  regresarCamaraOriginal(onCompleteCallback = null) {
    const camara = this.escena.cameras.main;
    const paso = this.pasos[this.pasoActual];

    const destinoX = paso?.enfoqueNpc ? paso.enfoqueNpc.x : this.escena.JugadorPrincipal.x;
    const destinoY = paso?.enfoqueNpc ? paso.enfoqueNpc.y : this.escena.JugadorPrincipal.y;

    camara.zoomTo(1, 1000, 'Power2');
    camara.pan(destinoX, destinoY, 1000, 'Power2', false, (camera, progress) => {
      if (progress === 1) {
        if (this.camaraEstabaSiguiendo) {
          camera.startFollow(this.camaraEstabaSiguiendo, true, 0.1, 0.1);
        }
        if (onCompleteCallback) onCompleteCallback();
      }
    });
  }

  finalizar() {
    this.activo = false;

    localStorage.setItem(this.idTutorial, 'true');

    this.escena.cameras.main.startFollow(this.escena.JugadorPrincipal, true, 0.1, 0.1);

    this.escena.input.off('pointerdown');

    if (this.globoContenedor) {
      this.escena.tweens.add({
        targets: this.globoContenedor,
        alpha: 0,
        duration: 300,
        onComplete: () => this.globoContenedor.destroy(),
      });
    }
  }

  crearGloboTexto(posicion, mensaje) {
    const ancho = 180;
    const alto = 70;
    const pad = 15;
    this.globoContenedor = this.escena.add.container(posicion.x, posicion.y - 60).setDepth(100);

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

    this.globoContenedor.add([fondo, this.textoGlobo]);
  }
}
