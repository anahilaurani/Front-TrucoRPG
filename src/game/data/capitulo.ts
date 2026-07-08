export const CAPITULO = [
    {
      icono: '📜',
      titulo: 'El Mundo del Truco',
      descripcion: 'Intro al juego',
      pagina: 1,
      entradas: [
        {
          titulo: '¿Qué es el Truco?',
          texto: 'El Truco es el juego de cartas más popular de Argentina. Se juega con el mazo español de 40 cartas y enfrenta a dos jugadores (o equipos) en una batalla de ingenio, bluff y estrategia.\n\nLa maña vale tanto como la suerte.',
        },
        {
          titulo: 'Objetivo del juego',
          texto: 'Llegar a 30 puntos antes que el rival. Los puntos se ganan en dos frentes: el Envido (antes de jugar cartas) y el Truco (enfrentando rondas). El primero en llegar a 30 gana.',
          tag: 'OBJETIVO',
        },
        {
          titulo: 'El arte del bluff',
          texto: 'En el Truco, mentir es parte del juego. Cantar Truco con cartas pésimas, fingir dudas con un ancho de espada en la mano... La cara de poker es tan importante como las cartas.',
          tag: 'ESENCIAL',
        },
        {
          titulo: 'Estructura de una mano',
          texto: 'Cada mano tiene dos fases: primero se juega el Envido (si alguien lo canta), y luego el Truco. Se juegan hasta 3 vueltas de cartas. Gana el Truco quien gane 2 de 3 vueltas.',
        },
      ],
    },
    {
      icono: '🃏',
      titulo: 'Las Cartas',
      descripcion: 'El mazo español',
      pagina: 3,
      entradas: [
        {
          titulo: 'El mazo español',
          texto: 'Se juega con 40 cartas (se retiran los 8, 9 y comodines del mazo estándar de 48). Hay 4 palos: Espadas ⚔️, Bastos 🌿, Oros 🪙 y Copas 🏆.\n\nCada jugador recibe 3 cartas al inicio de cada mano.',
        },
        {
          titulo: 'Jerarquía para el Truco',
          texto: '1° — Ancho de Espada ⚔️\n2° — Ancho de Basto 🌿\n3° — Siete de Espada ⚔️\n4° — Siete de Oro 🪙\n5° — Tres (cualquier palo)\n6° — Dos (cualquier palo)\n7° — As de Oro / Copa\n8° — Doce (cualquier palo)\n9° — Once (cualquier palo)\n10° — Diez (cualquier palo)\n11° — Siete de Copa / Basto\n12° — Seis → Cinco → Cuatro',
          tag: 'JERARQUÍA',
        },
        {
          titulo: 'Cómo contar puntos de Envido',
          texto: 'Las cartas del 1 al 7 valen su número. Los "palos" (10, 11, 12) valen 0 puntos.\n\nSi tenés 2 o más cartas del mismo palo: sumás las 2 más altas y le agregás 20.\n\nSi todas tus cartas son de palos diferentes: tu envido es el valor de la carta más alta.',
          tag: 'ENVIDO',
          nota: 'El máximo posible es 33 puntos (7+6+20)',
        },
      ],
    },
    {
      icono: '⚔️',
      titulo: 'El Truco',
      descripcion: 'Cantos y rondas',
      pagina: 7,
      entradas: [
        {
          titulo: '¿Cómo funciona?',
          texto: 'Se juegan hasta 3 vueltas. Cada jugador tira una carta por vuelta. El que tiene la carta más alta (según la jerarquía) gana esa vuelta. Quien gane 2 de 3 vueltas se lleva los puntos del Truco.',
        },
        {
          titulo: 'Los cantos',
          texto: 'Truco → vale 2 puntos\nRetruco → vale 3 puntos\nVale Cuatro → vale 4 puntos\n\nCada canto puede ser aceptado ("quiero"), rechazado ("no quiero", paga el anterior) o subido al siguiente escalón.',
          tag: 'CANTOS',
        },
        {
          titulo: '¿Quién puede cantar primero?',
          texto: 'En la primera vuelta, solo puede iniciar el Truco el jugador "pie" (el que juega primero, el mano del rival). En la segunda y tercera vuelta, cualquiera puede cantarlo.',
          tag: 'REGLA',
        },
        {
          titulo: 'La Parda (empate)',
          texto: 'Si en una vuelta ambos tiran cartas de igual valor, esa vuelta queda "parda". Las parda no le pertenece a nadie, aunque sí se tiene en cuenta para el desempate: quien ganó la primera vuelta gana si hay empate general.',
          tag: 'REGLA',
        },
        {
          titulo: 'Ir al mazo',
          texto: 'Podés rendirte antes de que termine la mano. Si no se cantó Truco todavía, te vas sin pagar nada. Si ya se cantó, pagás los puntos que estaban en juego hasta ese momento.',
        },
      ],
    },
    {
      icono: '🌊',
      titulo: 'El Envido',
      descripcion: 'Puntos y estrategia',
      pagina: 13,
      entradas: [
        {
          titulo: '¿Cuándo se canta?',
          texto: 'El Envido solo se puede cantar durante la primera vuelta de cartas, o justo antes de que empiece la segunda. Una vez que el primero en jugar tira su carta en la segunda vuelta, ya no se puede cantar envido.',
          tag: 'REGLA',
        },
        {
          titulo: 'Los cantos del Envido',
          texto: 'Envido → suma 2 puntos al pozo\nReal Envido → suma 3 puntos al pozo\nFalta Envido → el rival paga todo lo que le falta para llegar a 30\n\nSe pueden encadenar: "Envido... Envido... Real Envido... Falta Envido" y el pozo se va acumulando.',
          tag: 'CANTOS',
        },
        {
          titulo: '¿Quién gana?',
          texto: 'El que declare el mayor puntaje gana el pozo acumulado. En caso de empate exacto, gana el "pie" (quien cantó primero / jugó primero).\n\nSi rechazás ("no quiero"), el que cantó se lleva los puntos en juego hasta ese momento.',
          tag: 'DESEMPATE',
          nota: 'Nadie tiene que mostrar sus cartas si no hay conflicto. ¡Podés mentir sobre tus puntos!',
        },
        {
          titulo: 'Falta Envido cerca del 30',
          texto: 'El Falta Envido vale lo que le falta al que va perdiendo para llegar a 30. Si van 28-25, la Falta solo vale 5 puntos para el que va 25. Calculá antes de cantar.',
          tag: 'ESTRATEGIA',
        },
      ],
    },
    {
      icono: '🎯',
      titulo: 'Estrategias',
      descripcion: 'Jugadas ganadoras',
      pagina: 19,
      entradas: [
        {
          titulo: 'Control de la iniciativa',
          texto: 'Tener la mano (jugar primero) es una ventaja: podés "marcar el tono" del truco sin revelar todas tus cartas. En cambio, el pie tiene el derecho de cantar truco en la primera vuelta.',
        },
        {
          titulo: 'Bluffear el Envido',
          texto: 'Cantar Falta Envido con 25 puntos puede hacer que un rival con 28 no quiera arriesgar. El miedo a perder muchos puntos muchas veces es más poderoso que las cartas mismas.',
          tag: 'AVANZADO',
        },
        {
          titulo: 'Cantar Truco con cartas malas',
          texto: 'Tomar la iniciativa en el Truco, aunque tengas cartas mediocres, obliga al rival a decidir. Si no quiere, le ganás puntos gratis. Si acepta y subís a Retruco, el miedo puede hacerlo dudar.',
          tag: 'AVANZADO',
        },
        {
          titulo: 'Leer al rival',
          texto: 'Prestá atención a cuánto tarda en responder, si vuelve a mirar sus cartas, si cruza los brazos. El lenguaje corporal suele delatar más que las palabras. La psicología es la segunda mano que todos juegan.',
          tag: 'PSICOLOGIA',
        },
        {
          titulo: 'Cuándo ir al mazo',
          texto: 'Si perdiste la primera vuelta y tu carta de la segunda no es buena, considerá ir al mazo si no se cantó truco. No cuesta nada y guardás información sobre tu mano para futuras manos.',
        },
      ],
    },
    {
      icono: '💡',
      titulo: 'Tips y Consejos',
      descripcion: 'Secretos del jugador',
      pagina: 25,
      entradas: [
        {
          titulo: 'La primera carta que tirás habla',
          texto: 'Tirar un cuatro como primera carta dice "no tengo nada bueno". Tirar un tres dice "fuerza". Pensá si querés dar esa información o preferís disimular guardando tu mejor carta para después.',
          tag: 'TIP',
        },
        {
          titulo: 'No muestres lo que tenés',
          texto: 'Si tenés el ancho de espada, no lo tires en la primera vuelta si no es necesario. Guardalo para cuando el truco esté en juego. Una carta que ya cayó no puede hacer presión.',
          tag: 'TIP',
        },
        {
          titulo: 'Memorizá el marcador siempre',
          texto: 'Saber si vas 28 o 22 cambia todo. Un Falta Envido a tu favor vale más o menos según cuánto te falta. Tomá decisiones en base a los puntos, no solo a las cartas.',
          tag: 'ESENCIAL',
        },
        {
          titulo: 'El silencio también es estrategia',
          texto: 'No respondas de inmediato al Truco. Tomarte unos segundos —aunque tengas el ancho— genera presión psicológica. El rival no sabe si estás a punto de subir o de echarte al mazo.',
          tag: 'PSICOLOGIA',
        },
        {
          titulo: 'Guardá el mejor para el final',
          texto: 'Si ganaste la primera vuelta, en la segunda podés tirar una carta mediocre. Si el rival tira su mejor carta para empardar, vos ya ganaste la mano y revelaste información valiosa sin costo.',
          tag: 'AVANZADO',
        },
        {
          titulo: 'El envido primero',
          texto: 'Si pensás cantar envido, hacelo antes de que empiece el truco. Una vez que alguien tira carta en la segunda vuelta, perdiste la oportunidad. Es el error más común de los principiantes.',
          tag: 'TIP',
        },
      ],
    },
]