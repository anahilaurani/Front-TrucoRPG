import Phaser from 'phaser';
import BaseScene from './escenas/BaseScene.js';
import HistoriaBootScene from './escenas/HistoriaBootScene.js';
import MapaPrincipalScene from './escenas/MapaPrincipalScene.js';
import InteriorCasaScene from './escenas/InteriorCasaScene.js';
import InteriorPulperiaScene from './escenas/InteriorPulperiaScene.js';
import MapaAventura1Scene from './escenas/MapaAventura1Scene.js';
import MapaAventura2Scene from './escenas/MapaAventura2Scene.js';
import MapaAventura3Scene from './escenas/MapaAventura3Scene.js';

export function initHistoria(parent = 'historia-container', salaService, uiService) {
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
        if (esTactil) {
          try {
            if (game && game.canvas) {
              const ctx = game.canvas.getContext && game.canvas.getContext('2d');
              if (ctx) ctx.imageSmoothingEnabled = false;
              game.canvas.style.imageRendering = 'pixelated';
            }
          } catch (err) {}
        } else {
          try {
            if (game && game.canvas) {
              game.canvas.style.imageRendering = 'auto';
            }
          } catch (err) {}
        }
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 708,
      fullscreenTarget: '.contenedor-juego-wrapper',
    },
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    scene: [
      HistoriaBootScene,
      MapaPrincipalScene,
      BaseScene,
      InteriorCasaScene,
      InteriorPulperiaScene,
      MapaAventura1Scene,
      MapaAventura2Scene,
      MapaAventura3Scene,
    ],
    parent,
  };

  const gameInstance = new Phaser.Game(config);

  gameInstance.registry.set('salaService', salaService);
  gameInstance.registry.set('uiService', uiService);

  return gameInstance;
}
