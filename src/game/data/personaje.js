export const PERSONAJES = [
    { id: 0, nombrePersonaje: 'Primero', spriteKey: 'personaje1', img:'/Imagenes/avatares/personaje1.png' },
    { id: 1, nombrePersonaje: 'Segundo', spriteKey: 'personaje2', img:'/Imagenes/avatares/personaje2.png'},
    { id: 2, nombrePersonaje: 'Tercero', spriteKey: 'personaje3', img:'/Imagenes/avatares/personaje3.png'},
    { id: 3, nombrePersonaje: 'Cuarto', spriteKey: 'personaje2', img:'/Imagenes/avatares/personaje2.png'}
];

export function personajePorId(id) {
    return PERSONAJES.find(p => p.id === id) ?? null;
}

export function personajePorSpriteKey(spriteKey){
    return PERSONAJES.find(p => p.spriteKey === spriteKey) ?? null;
}