export const HABILIDADES = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Manipulador',
    pasiva: '10% más de probabilidad de recibir cartas de valor alto al repartir.',
    activa: 'Cada 3 manos: reemplazá 1 carta por otra del mazo (nunca de menor valor).',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'Timbero',
    pasiva: 'Al inicio de cada mano: 20% cara (+1 pt), 80% cruz (sin bonus).',
    activa: 'Antes de jugar: apostá. Si ganás la mano, duplicás puntos; si perdés, rival +2.',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nombre: 'Fanfarrón',
    pasiva: 'En empate de envido, ganás vos (no gana la mano).',
    activa: 'Tu próximo envido o truco aceptado vale +1 punto extra.',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    nombre: 'Mentiroso',
    pasiva: 'El rival no ve cuándo tenés la habilidad activa disponible.',
    activa: 'Cada 2 manos: al inicio, revelás 1 carta aleatoria del rival.',
  },
];

export function habilidadPorId(id) {
  return HABILIDADES.find((h) => h.id === id) ?? null;
}

const CLASE_HEROE_POR_HABILIDAD = {
  '11111111-1111-1111-1111-111111111111': 0,
  '22222222-2222-2222-2222-222222222222': 1, 
  '33333333-3333-3333-3333-333333333333': 2, 
  '44444444-4444-4444-4444-444444444444': 3, 
};

export function claseHeroePorHabilidadId(id) {
  return CLASE_HEROE_POR_HABILIDAD[id] ?? null;
}
