import Phaser from 'phaser';
export default class Oponente extends Phaser.Physics.Arcade.Sprite {

    constructor(escena, x, y, nombre){
        super(escena, x, y, nombre);

        this.nombre = nombre;

        escena.add.existing(this);
        escena.physics.add.existing(this);

        this.setScale(1.4);

        this.body.setAllowGravity(false);

        escena.anims.create({
            key: `${this.nombre}-quieto`,
            frames: escena.anims.generateFrameNumbers(this.nombre, { start: 0, end: 3 }),
            frameRate: 5,
            repeat: -1
        });

        this.anims.play(`${this.nombre}-quieto`, true);
    }

    update(keys){
    }

    // Cae derrotado: se sacude, cae de costado y queda tirado con tinte gris.
    // Con desaparecer=true, después de caer se desvanece y se elimina del mapa.
    // Con animar=false aplica el estado final directo (para cuando ya estaba derrotado al cargar).
    caerDerrotado(animar = true, onComplete, desaparecer = false) {
        if (this.derrotado) {
            onComplete?.();
            return;
        }
        this.derrotado = true;
        this.anims.stop();

        if (!animar) {
            if (desaparecer) {
                this.destroy();
            } else {
                this.setAngle(90);
                this.setTint(0x808080);
                this.setAlpha(0.85);
            }
            onComplete?.();
            return;
        }

        const escena = this.scene;

        // sacudida
        escena.tweens.add({
            targets: this,
            x: this.x + 5,
            duration: 60,
            yoyo: true,
            repeat: 4,
            onComplete: () => {
                this.setTint(0xff6666);

                // caída de costado
                escena.tweens.add({
                    targets: this,
                    angle: 90,
                    y: this.y + 12,
                    duration: 650,
                    ease: 'Bounce.easeOut',
                    onComplete: () => {
                        this.setTint(0x808080);
                        this.setAlpha(0.85);

                        if (!desaparecer) {
                            this.cayendo = false;
                            onComplete?.();
                            return;
                        }

                        // se desvanece y desaparece del mapa
                        escena.tweens.add({
                            targets: this,
                            alpha: 0,
                            duration: 600,
                            delay: 250,
                            onComplete: () => {
                                this.cayendo = false;
                                this.destroy();
                                onComplete?.();
                            },
                        });
                    },
                });
            },
        });
    }
}