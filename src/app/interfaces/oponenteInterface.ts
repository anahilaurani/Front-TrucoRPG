import { Habilidad } from "./habilidad";
import { FaseOponente } from "./faseOponente";

export interface Oponente {
  id: string;
  nombre: string;
  apodo: string;
  icono: string;
  imagen: string;
  intro: string;
  habilidades?: Habilidad[];
  fases?: FaseOponente[];
}