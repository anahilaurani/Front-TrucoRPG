import { Entrada } from "./entrada";
export interface Capitulo {
  icono: string;
  titulo: string;
  descripcion: string;
  pagina: number;
  entradas: Entrada[];
}