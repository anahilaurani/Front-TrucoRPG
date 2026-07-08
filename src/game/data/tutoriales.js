export const TUTORIALES = {
  pulperia: [
    {
      texto: '¡Hola, forastero! Bienvenido a la Pulpería del pueblo.',
      enfoque: 'npc',
    },
    {
      texto: 'Mirá, en aquella mesa del rincón podés jugar partidas en solitario.',
      enfoque: 'npc',
      camaraDestino: { x: 1800, y: 180 },
      camaraTiempo: 1200,
      camaraZoom: 2.2,
    },
    {
      texto: '¡En la mesa de al lado podés crear tus propias partidas multijugador!',
      enfoque: 'npc',
      camaraDestino: { x: 1270, y: 180 },
      camaraTiempo: 1200,
      camaraZoom: 1.8,
    },
    {
      texto: 'Y cuando necesites comprar algo, acercate al mostrador y presiona la letra E para interactuar conmigo!',
      enfoque: 'npc',
      seguirJugador: true,
    },
    {
      texto: 'Tomate tu tiempo, explorá y divertite.',
      enfoque: 'npc',
      seguirJugador: true,
    },
  ],


  mapaPrincipal: [
    {
      texto: '¡Bienvenido al pueblo! Antes de empezar te quiero contar varias cosas.',
      enfoque: 'npc',
    },
    {
      texto: 'Podés moverte con las flechas del teclado o el stick de tu dispositivo.',
      enfoque: 'npc',
    },
    {
      texto: 'Para interactuar con objetos o personajes presioná la letra E',
      enfoque: 'npc',
    },
    {
      texto: 'Si querés poner la vista en pantalla completa presioná la letra F',
      enfoque: 'npc',
    },
    {
      texto: 'En tu casa vas a encontrar tu inventario, tus logros y el armario.',
      enfoque: 'npc',
    },
    {
      camaraDestino: { x: 453, y: 155 },
      camaraTiempo: 750,
      camaraZoom: 1.8,
    },
    {
      texto: 'En la pulperia vas a poder jugar partidas en multijugador con amigos, personas conectadas o partidas en solitario.',
      enfoque: 'npc',
    },
    {
      camaraDestino: { x: 1910, y: 155 },
      camaraTiempo: 750,
    },
    {
      texto: 'Allí encontrarás rivales para poner a prueba tus cartas.',
      enfoque:'npc',
    },
    {
      texto: 'Junto a la pulpería hay un cartel con flecha roja, ese es el cartel que te va a llevar a la aventura!',
      enfoque: 'npc',
    },
    {
      camaraDestino: { x: 1910, y: 305 },
      camaraTiempo: 750,
      camaraZoom: 2,
    },
    {
      texto: 'Interactuá con él cuando estés listo para partir a vencer diferentes oponentes.',
      enfoque: 'npc',
    },

    {
      texto: 'Ahora sí, el camino es tuyo. ¡Buena suerte!',
      enfoque: 'npc',
      seguirJugador: true,
    },
  ],
};
