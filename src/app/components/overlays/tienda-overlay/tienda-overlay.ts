import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriaTienda } from '../../../interfaces/categoriaTienda';
import { ObjetoTienda } from '../../../interfaces/ObjetoTienda';
import { TiendaService } from '../../../services/tienda/tienda-service';
import { InventarioService } from '../../../services/inventario/inventario-service';

@Component({
  selector: 'app-tienda-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tienda-overlay.html',
  styleUrls: ['./tienda-overlay.css'],
})
export class TiendaOverlayComponent implements OnInit {
  private tiendaService = inject(TiendaService);
  private inventarioService = inject(InventarioService);

  datos: CategoriaTienda[] = [];
  objetoActivo: ObjetoTienda | null = null;
  objetoFijado: ObjetoTienda | null = null;
  confirmandoCompra: boolean = false;
  monedas: number = 0;

  /** Ids de ítems que el usuario ya posee (no se pueden volver a comprar). */
  idsComprados = new Set<number>();

  mensajeResultado: string | null = null;
  esError: boolean = false;

  // Nombres/iconos por clase de habilidad (fallback cuando el backend manda el placeholder).
  private static readonly NOMBRE_CLASE: Record<string, string> = {
    manipulador: 'Manipulador',
    timbero: 'Timbero',
    fanfarron: 'Fanfarrón',
    mentiroso: 'Mentiroso',
  };

  ngOnInit() {
    this.cargarTienda();
    this.cargarInventario();
  }

  cargarInventario() {
    this.inventarioService.obtenerInventario().subscribe({
      next: (res) => {
        const items = res?.items ?? res?.Items ?? [];
        this.idsComprados = new Set<number>(
          items
            .map((l: any) => l.itemTiendaId ?? l.ItemTiendaId ?? l.itemTienda?.id)
            .filter((id: any): id is number => id != null),
        );
      },
      error: (err) => console.error('Error al obtener el inventario', err),
    });
  }

  estaComprado(objeto: ObjetoTienda | null): boolean {
    return objeto != null && this.idsComprados.has(objeto.id);
  }

  private claseDesde(descripcion?: string): string | null {
    const d = (descripcion ?? '').toLowerCase();
    if (d.includes('manipulador')) return 'manipulador';
    if (d.includes('timbero')) return 'timbero';
    if (d.includes('fanfarr')) return 'fanfarron';
    if (d.includes('mentiroso')) return 'mentiroso';
    return null;
  }

  /** Icono a mostrar: usa el del backend salvo que sea el placeholder inexistente (objeto.png). */
  obtenerIcono(objeto: ObjetoTienda | null): string {
    const img = objeto?.img ?? '';
    if (img && !img.endsWith('/objeto.png')) return img;
    const clase = this.claseDesde(objeto?.descripcion);
    return clase ? `/assets/objetos/habilidad-${clase}.png` : img || '/assets/objetos/objeto.png';
  }

  /** Nombre a mostrar: corrige el placeholder repetido "BOLEADORAS" por el nombre de la clase. */
  obtenerNombre(objeto: ObjetoTienda | null): string {
    const nombre = objeto?.nombre ?? '';
    const clase = this.claseDesde(objeto?.descripcion);
    if (clase && nombre.trim().toUpperCase() === 'BOLEADORAS') {
      return TiendaOverlayComponent.NOMBRE_CLASE[clase];
    }
    return nombre;
  }

  cargarTienda() {
    this.tiendaService.cargarTienda().subscribe({
      next: (res) => {
        this.datos = res.tienda;       
        this.monedas = res.monedasUsuario;
      },
      error: (err) => console.error('Error al cargar la tienda', err),
    });
  }

  mostrarInfo(objeto: ObjetoTienda) {
    if (this.objetoFijado) return;
    if (this.objetoActivo !== objeto) {
      this.objetoActivo = objeto;
      this.confirmandoCompra = false;
      this.limpiarMensaje();
    }
  }

  ocultarInfo(objeto: ObjetoTienda) {
    // Al retirar el cursor, se vuelve al estado original (salvo que haya algo fijado con click).
    if (this.objetoFijado) return;
    if (this.objetoActivo === objeto) {
      this.objetoActivo = null;
      this.confirmandoCompra = false;
      this.limpiarMensaje();
    }
  }

  seleccionarObjeto(objeto: ObjetoTienda) {
    if (this.objetoFijado === objeto) {
      this.liberarSeleccion();
    } else {
      this.objetoFijado = objeto;
      this.objetoActivo = objeto;
      this.confirmandoCompra = false;
      this.limpiarMensaje();
    }
  }

  liberarSeleccion() {
    this.objetoFijado = null;
    this.confirmandoCompra = false;
    this.limpiarMensaje();
  }

  cancelarCompra() {
    this.confirmandoCompra = false;
  }

  limpiarMensaje() {
    this.mensajeResultado = null;
    this.esError = false;
  }

  confirmarAccionCompra() {
  if (this.objetoActivo) {
    const itemComprado = this.objetoActivo; 

    this.tiendaService.comprar(itemComprado.id).subscribe({
      next: (respuesta) => {
        this.esError = false;
        this.mensajeResultado = respuesta.mensaje || '¡Compra realizada con éxito!';
        this.confirmandoCompra = false;

        // Marcar como comprado para que no se pueda volver a comprar.
        this.idsComprados.add(itemComprado.id);

        const precioItem = itemComprado.precio || (itemComprado as any).Precio;

        if (precioItem) {
          this.monedas -= precioItem;
        }
      },
      error: (err) => {
        this.esError = true;
        this.confirmandoCompra = false;
        this.mensajeResultado = err.error?.mensaje || 'No se pudo procesar la compra.';
        console.error('Error al procesar la compra:', err);
      }
    });
  }
}
}