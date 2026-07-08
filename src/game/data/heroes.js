/** Textos de habilidades para UI (selección de héroe y panel en partida). */
export const HEROES = [
  {
    id: 0,
    nombre: 'Manipulador',
    color: '#aa66ff',
    pasiva: '10% más de probabilidad de recibir cartas de valor alto al repartir.',
    activa: 'Cada 3 manos: reemplazá 1 carta por otra del mazo (nunca de menor valor).',
    img: 'assets/objetos/habilidad-manipulador.png',
  },
  {
    id: 1,
    nombre: 'Timbero',
    color: '#ffaa44',
    pasiva: 'Al inicio de cada mano: 20% cara (+1 pt), 80% cruz (sin bonus).',
    activa: 'Antes de jugar: apostá. Si ganás la mano, duplicás puntos; si perdés, rival +2.',
    img: 'assets/objetos/habilidad-timbero.png',
  },
  {
    id: 2,
    nombre: 'Fanfarrón',
    color: '#44aaff',
    pasiva: 'En empate de envido, ganás vos (no gana la mano).',
    activa: 'Tu próximo envido o truco aceptado vale +1 punto extra.',
    img: 'assets/objetos/habilidad-fanfarron.png',
  },
  {
    id: 3,
    nombre: 'Mentiroso',
    color: '#66dd88',
    pasiva: 'El rival no ve cuándo tenés la habilidad activa disponible.',
    activa: 'Cada 2 manos: al inicio, revelás 1 carta aleatoria del rival.',
    img: 'assets/objetos/habilidad-mentiroso.png',
  },
];

export function heroePorId(id) {
  return HEROES.find((h) => h.id === id) ?? null;
}

export function textoFichaHeroe(heroe) {
  if (!heroe) return '';
  return `Héroe: ${heroe.nombre}\n\n` + `Pasiva: ${heroe.pasiva}\n\n` + `Activa: ${heroe.activa}`;
}

export function textoPanelPartida(heroe, numeroDeMano) {
  if (!heroe) return '';
  return (
    `${heroe.nombre} · mano ${numeroDeMano}\n\n` +
    `Pasiva: ${heroe.pasiva}\n\n` +
    `Activa: ${heroe.activa}`
  );
}
