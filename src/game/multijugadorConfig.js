import Phaser from 'phaser';
import BaseScene from './escenas/BaseScene.js';
import MultiBootScene from './escenas/MultiBootScene.js';
import SalaMultijugadorScene from './escenas/SalaMultijugadorScene.js';

export function initMultijugador(parent = 'multijugador-container', salaService, uiService) {
  const esTactil = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;

  const config = {
    type: Phaser.AUTO,
    pixelArt: esTactil,
    roundPixels: esTactil,
    callbacks: {
      postBoot: (game) => {
        if (esTactil && screen.orientation?.lock) {
          screen.orientation.lock('landscape').catch(() => {});
        }
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 708,
      fullscreenTarget: '.contenedor-multi-wrapper',
    },
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    scene: [MultiBootScene, BaseScene, SalaMultijugadorScene],
    parent,
  };

  const gameInstance = new Phaser.Game(config);
  gameInstance.registry.set('salaService', salaService);
  gameInstance.registry.set('uiService', uiService);

  return gameInstance;
}
