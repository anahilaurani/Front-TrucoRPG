import { Oponente } from '../../app/interfaces/oponenteInterface'; 

export const OPONENTES: Oponente[] = [
  {
      id: 'nahuelito',
      nombre: 'Nahuelito',
      apodo: 'El que nada entre brumas',
      icono: '🌊',
      imagen: '/assets/oponentes1v1/nahuelito_batalla.png',
      intro:
        'Emerge de las aguas frías del sur. Nadie le vio la cara completa, pero todos coinciden en algo: las cartas, cerca de él, dejan de ser lo que parecen.',
      habilidades: [
        {
          nombre: 'Salpicadura',
          texto:
            'Cada 2 manos, Nahuelito cambia el palo de 2 de tus cartas (por ejemplo, una Espada puede transformarse en Copa). Tu jerarquía y tu Envido pueden verse alterados sin previo aviso.',
          tag: 'HABILIDAD',
          nota: 'Revisá tus cartas después de cada salpicadura: lo que tenías puede no ser lo que tenés.',
        },
        {
          nombre: 'Remolino',
          texto:
            'Al jugar la primera carta de la primera baza, hay un 50% de probabilidad de que Nahuelito cambie el palo de esa carta jugada en la mesa.',
          tag: 'PASIVA',
          nota: 'Podés ir ganando la baza y que el agua lo cambie todo.',
        },
      ],
    },
    {
      id: 'pombero',
      nombre: 'El Pombero',
      apodo: 'El dueño del monte',
      icono: '🌲',
      imagen: '/assets/oponentes1v1/pomberito_batalla.png',
      intro:
        'Silbidos en el monte, pasos que no se ven. El Pombero conoce tus cartas antes que vos mismo las olvides.',
      habilidades: [
        {
          nombre: 'Travesura del monte',
          texto:
            'Cada 2 manos, el Pombero te muestra tus 3 cartas durante 5 segundos y luego oculta 2 al azar durante toda la ronda.',
          tag: 'HABILIDAD',
          nota: 'Memorizá bien tu mano en esos 5 segundos: vas a jugar a ciegas con dos de tus cartas.',
        },
        {
          nombre: 'Trampa del monte',
          texto:
            'Si nadie cantó envido ni truco en la mano, el Pomberito suma +1 punto extra al cerrarla (aunque hayas ganado vos o te hayas ido al mazo en silencio).',
          tag: 'PASIVA',
          nota: 'El silencio en la mesa también le juega a su favor.',
        },
      ],
    },
    {
      id: 'lobizon',
      nombre: 'El Lobizón',
      apodo: 'El séptimo hijo',
      icono: '🐺',
      imagen: '/assets/oponentes/lobizon.png',
      intro:
        'Bajo la luna llena cambia de forma. Su aullido no es solo una advertencia: es una sentencia para quien lo escuche en plena partida.',
      habilidades: [
        {
          nombre: 'Rasguño',
          texto:
            'Cada 2 manos, debilita 1 carta aleatoria de tu mano bajando su valor en 1 (ej. un 3 pasa a un 2).',
          tag: 'HABILIDAD',
          nota: 'Revisá tu mano después del rasguño: una carta puede haber perdido fuerza.',
        },
        {
          nombre: 'Luna llena',
          texto:
            'Si aceptás el truco, retruco o vale cuatro de la máquina, debilita 1 carta de tu mano en mitad de ronda (una vez por mano).',
          tag: 'PASIVA',
          nota: 'Aceptar un canto del Lobizón tiene un costo.',
        },
        {
          nombre: 'Aullido',
          texto:
            'Si ganás la primera baza, hay un 20% de probabilidad de que el Lobizón te asuste y te mande al mazo automáticamente.',
          tag: 'PASIVA',
          nota: 'No aplica si la primera baza fue parda.',
        },
      ],
    },
    {
      id: 'luzmala',
      nombre: 'La Luz Mala',
      apodo: 'El alma errante',
      icono: '👻',
      imagen: '/assets/oponentes/luzmala.png',
      intro:
        'Un resplandor pálido que aparece en los campos de noche. Dicen que es un alma en pena buscando algo que perdió... o una carta que vos vas a perder.',
      habilidades: [
        {
          nombre: 'Destello',
          texto:
            'Cada 2 turnos en bazas 1 o 2, la Luz Mala te confunde y te obliga a jugar una carta al azar (50% en baza 1, 50% en baza 2).',
          tag: 'HABILIDAD',
          nota: 'Guardá tu mejor carta con cuidado: el destello no respeta tu estrategia.',
        },
        {
          nombre: 'Espejismo',
          texto:
            'Si la Luz Mala es mano y abre la baza 1, su carta parpadea mostrando un número y palo falsos (solo visual) hasta que respondas.',
          tag: 'PASIVA',
          nota: 'La carta real no cambia: solo tu vista se confunde.',
        },
      ],
    },
    {
      id: 'mandinga',
      nombre: 'El Mandinga',
      apodo: 'El que viene a cobrar',
      icono: '😈',
      imagen: '/assets/oponentes/mandinga.png',
      intro:
        'No hay tahúr que se compare. El Diablo en persona se sienta a la mesa, y a medida que el marcador sube, también lo hace su sed de almas y de tantos.',
      fases: [
        {
          rango: '0 – 5 PTS',
          titulo: 'Fase I — El Pacto',
          texto:
            'Cada 3 manos pesa una maldición sobre la mesa: si el Diablo gana esa mano, se lleva el doble de puntos. Si la gana el héroe, no suma nada.',
        },
        {
          rango: '5+ PTS',
          titulo: 'Fase II — El Engaño',
          texto:
            'El Diablo te deja ver las 3 cartas repartidas durante 5 segundos. Pasado ese tiempo, las da vuelta y no podés volver a verlas hasta el momento en que las jugués.',
        },
        {
          rango: 'FASE FINAL',
          titulo: 'Fase III — El Espejo',
          texto:
            'Cada cierta cantidad de manos, el Mandinga copia el valor de tu última carta jugada más alta, usándola como si fuera propia.',
        },
      ],
    },
  ];
