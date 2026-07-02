import Phaser from 'phaser';

export default class BaseScene extends Phaser.Scene {
  constructor(key) {
    super(key);

    this.joystick = null;
    this.esTactil = false;
    this.botonInteractuarPresionado = false;
  }

  crearControlesMobile() {
    const urlParams = new URLSearchParams(window.location.search);
    const forzar = urlParams.get('joystick') === '1';

    this.esTactil =
      forzar || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;

    if (!this.esTactil) return;

    const rexPlugin = this.plugins.get ? this.plugins.get('rexvirtualjoystickplugin') : null;
    if (!rexPlugin) {
      console.warn('Plugin rexvirtualjoystickplugin no disponible');
      return;
    }

    this.joystick = rexPlugin.add(this, {
      x: this.scale.width * 0.15,
      y: this.scale.height * 0.8,
      radius: 80,
      base: this.add.circle(0, 0, 80, 0x000000, 0.4),
      thumb: this.add.circle(0, 0, 40, 0xffffff, 0.7),
      dir: '8dir',
      forceMin: 16,
    });

    this.joyStick = this.joystick;

    // Crear el botón "Interactuar" inicialmente
    this._btnInteractuarBg = this.add
      .rectangle(this.scale.width * 0.85, this.scale.height * 0.8, 130, 50, 0x000000, 0.5)
      .setStrokeStyle(2, 0xffffff, 0.6)
      .setDepth(1000)
      .setScrollFactor(0)
      .setInteractive();

    this._btnInteractuarTxt = this.add
      .text(this.scale.width * 0.85, this.scale.height * 0.8, '⚡ Interactuar', {
        fontFamily: '"Jersey 10"',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(1001)
      .setScrollFactor(0)
      .setInteractive();

    if (this.joystick.base) this.joystick.base.setDepth(1000).setScrollFactor(0);
    if (this.joystick.thumb) this.joystick.thumb.setDepth(1001).setScrollFactor(0);

    this.scale.on('resize', (gameSize) => {
      const w = gameSize.width;
      const h = gameSize.height;

      if (this.joystick) {
        this.joystick.x = w * 0.15;
        this.joystick.y = h * 0.8;
      }

      if (this._btnInteractuarBg && this._btnInteractuarTxt) {
        this._btnInteractuarBg.setPosition(w * 0.85, h * 0.8);
        this._btnInteractuarTxt.setPosition(w * 0.85, h * 0.8);
      }
    });

    const activarInteraccion = () => {
      this.botonInteractuarPresionado = true;
      this._btnInteractuarBg.setFillStyle(0x334433, 0.8);
      this.time.delayedCall(100, () => {
        this._btnInteractuarBg.setFillStyle(0x000000, 0.5);
      });
    };

    this._btnInteractuarBg.on('pointerdown', activarInteraccion);
    this._btnInteractuarTxt.on('pointerdown', activarInteraccion);

    const restaurarBoton = () => {
      if (this._btnInteractuarBg.active) {
        this._btnInteractuarBg.setFillStyle(0x000000, 0.5);
      }
    };

    this._btnInteractuarBg.on('pointerup', restaurarBoton);
    this._btnInteractuarBg.on('pointerout', restaurarBoton);
    this._btnInteractuarTxt.on('pointerup', restaurarBoton);
    this._btnInteractuarTxt.on('pointerout', restaurarBoton);
  }

  // Panea la cámara hasta el jefe, reproduce la caída y al terminar
  // ejecuta alTerminar (si hay) o vuelve al jugador.
  // Con desaparecer=true el jefe se desvanece y se elimina del mapa después de caer.
  animarDerrotaJefe(jefe, { alTerminar, desaparecer = false } = {}) {
    jefe.cayendo = true;
    this._animandoDerrota = true;

    const cam = this.cameras.main;
    cam.stopFollow();
    cam.pan(jefe.x, jefe.y, 700, 'Sine.easeInOut', false, (camera, progress) => {
      if (progress !== 1) return;

      jefe.caerDerrotado(
        true,
        () => {
          if (alTerminar) {
            this._animandoDerrota = false;
            alTerminar();
            return;
          }

          this.time.delayedCall(300, () => {
            cam.pan(
              this.JugadorPrincipal.x,
              this.JugadorPrincipal.y,
              700,
              'Sine.easeInOut',
              false,
              (c, p) => {
                if (p === 1) {
                  cam.startFollow(this.JugadorPrincipal, true, 0.1, 0.1);
                  this._animandoDerrota = false;
                }
              },
            );
          });
        },
        desaparecer,
      );
    });
  }

  ocultarBotonInteractuar() {
    this._btnInteractuarBg?.setVisible(false);
    this._btnInteractuarTxt?.setVisible(false);
  }

  botonPantallaCompleta() {
    let teclaF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F, false);
    teclaF.on('down', () => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();

        if (screen.orientation?.lock) {
          screen.orientation.lock('landscape').catch(() => {});
        }
      }
    });

    this.add
      .text(10, 10, '[Pantalla completa]', { fill: '0f0' })
      .setInteractive()
      .on('pointerdown', () => {
        if (!this.scale.isFullscreen) {
          this.scale.startFullscreen();
          if (screen.orientation?.lock) {
            screen.orientation.lock('landscape').catch(() => {});
          }
        }
      })
      .setDepth(5);
  }
}
