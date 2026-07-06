export default class MesaManager {
  /**
   * @param {Phaser.Scene} scene
   * @param {*} jugador
   * @param {*} salaService
   * @param {*} uiService
   * @param {Object|null} anclajesPorModo
   * @param {Phaser.GameObjects.Group|null} mesasDecoracionGroup
   */
  constructor(
    scene,
    jugador,
    salaService,
    uiService,
    anclajesPorModo = null,
    mesasDecoracionGroup = null,
  ) {
    this.scene = scene;
    this.jugador = jugador;
    this.salaService = salaService;
    this.uiService = uiService;
    this.anclajesPorModo = anclajesPorModo;
    this.mesasDecoracionGroup = mesasDecoracionGroup;

    this.mesasPublicasGroup = this.scene.physics.add.group();

    this._onSalaActualizada = () => this.actualizarMesas().catch(() => {});
    window.addEventListener('sala-lista-actualizada', this._onSalaActualizada);
  }

  async actualizarMesas() {
    if (!this.salaService || this._destroyed) return;

    try {
      await this.salaService.conectar();

      const [s1, s2, s3] = await Promise.all([
        this.salaService.listarSalasPublicas('1v1'),
        this.salaService.listarSalasPublicas('2v2'),
        this.salaService.listarSalasPublicas('3v3'),
      ]);

      // La escena pudo cerrarse mientras esperábamos las salas: si el grupo ya fue
      // destruido, getChildren() leería this.children (undefined) y rompería.
      if (this._destroyed || !this.mesasPublicasGroup?.children) return;

      this.mesasPublicasGroup.getChildren().forEach((mesa) => {
        const texto = mesa.getData('textoAsociado');
        const zona = mesa.getData('zonaAsociada');
        if (texto) texto.destroy();
        if (zona) zona.destroy();
      });
      this.mesasPublicasGroup.clear(true, true);

      if (this.anclajesPorModo) {
        const salasPorModo = { '1v1': s1, '2v2': s2, '3v3': s3 };
        const OFFSET_Y = 140;
        const ESPACIO_X = 110;

        Object.entries(salasPorModo).forEach(([, salas]) => {
          salas.forEach((sala, index) => {
            const ancla = this.anclajesPorModo[sala.modo || sala.gameMode];
            if (!ancla) return;
            const posX = ancla.x + (index - (salas.length - 1) / 2) * ESPACIO_X;
            const posY = ancla.y + OFFSET_Y;

            const spriteAUsar = sala.modo === '1v1' ? 'MesaEspera' : 'MesaEjemplo2';
            this.crearMesaDeJuego(posX, posY, sala, spriteAUsar);
          });
        });
      } else {
        const todasLasSalas = [...s1, ...s2, ...s3];

        if (this.mesasDecoracionGroup) {
          this.mesasDecoracionGroup.getChildren().forEach((mesaDeco) => {
            mesaDeco.setVisible(true);
            if (mesaDeco.body) mesaDeco.body.enable = true;
          });
        }

        const posicionesDisponibles = [
          { x: 1040, y: 370 }, // Espacio Mesa 3
          { x: 1480, y: 370 }, // Espacio Mesa 4
          { x: 1050, y: 560 }, // Espacio Mesa 6
          { x: 1605, y: 570 }, // Espacio Mesa 5
        ];

        todasLasSalas.forEach((sala, index) => {
          const coord = posicionesDisponibles[index] || {
            x: 1040 + (index - posicionesDisponibles.length) * 280,
            y: 750,
          };

          const posX = coord.x;
          const posY = coord.y;

          if (this.mesasDecoracionGroup) {
            this.mesasDecoracionGroup.getChildren().forEach((mesaDeco) => {
              const xRef = mesaDeco.posXOriginal ?? mesaDeco.x;
              const yRef = mesaDeco.posYOriginal ?? mesaDeco.y;

              const distancia = Phaser.Math.Distance.Between(xRef, yRef, posX, posY);

              if (distancia < 20) {
                mesaDeco.setVisible(false);
                if (mesaDeco.body) mesaDeco.body.enable = false;
              }
            });
          }

          let spriteAUsar = 'MesaEspera';
          if (sala.modo === '2v2' || sala.gameMode === '2v2') {
            spriteAUsar = 'MesaEjemplo2';
          } else if (sala.modo === '3v3' || sala.gameMode === '3v3') {
            spriteAUsar = 'MesaEjemplo';
          }

          this.crearMesaDeJuego(posX, posY, sala, spriteAUsar);
        });
      }
    } catch (error) {
      console.error('Error al actualizar las salas desde MesaManager:', error);
    }
  }

  crearMesaDeJuego(x, y, sala, spriteKey = 'MesaEspera') {
    const mesa = this.mesasPublicasGroup.create(x, y, spriteKey);
    mesa.setScale(1).setImmovable(true);

    if (this.scene.anims.exists(spriteKey + '_idle')) {
      mesa.play(spriteKey + '_idle');
    }

    const textoContador = this.scene.add
      .text(x, y - 45, `SALA: ${sala.codigo}\n${sala.jugadores}/${sala.maxJugadores}`, {
        fontFamily: "'Jersey 20'",
        fontSize: '17px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        align: 'center',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(4);

    let zonaInteraccion = this.scene.add.zone(x, y, 90, 90);
    this.scene.physics.add.existing(zonaInteraccion);

    mesa.setData('textoAsociado', textoContador);
    mesa.setData('zonaAsociada', zonaInteraccion);

    this.scene.physics.add.overlap(this.jugador, zonaInteraccion, () => {
      const interactuoMobile = this.scene.botonInteractuarPresionado;
      if (Phaser.Input.Keyboard.JustDown(this.scene.teclaE) || interactuoMobile) {
        this.unirseASalaDesdeMesa(sala.codigo, sala.modo);
      }
    });
  }

  unirseASalaDesdeMesa(codigo, modo) {
    if (this.uiService) {
      this.jugador.body.setVelocity(0);
      this.uiService.abrirOverlay('multijugador', 'tradicional', {
        mode: 'unirse',
        codigoSugerido: codigo,
        gameMode: modo,
      });
    }
  }

  destroy() {
    this._destroyed = true;
    window.removeEventListener('sala-lista-actualizada', this._onSalaActualizada);
    if (this.mesasPublicasGroup) {
      this.mesasPublicasGroup.clear(true, true);
    }
  }
}
