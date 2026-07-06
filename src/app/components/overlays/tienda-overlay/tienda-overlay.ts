import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriaTienda } from '../../../interfaces/categoriaTienda';
import { ObjetoTienda } from '../../../interfaces/ObjetoTienda';
import { TiendaService } from '../../../services/tienda/tienda-service';

@Component({
  selector: 'app-tienda-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tienda-overlay.html',
  styleUrls: ['./tienda-overlay.css'],
})
export class TiendaOverlayComponent implements OnInit {
  private tiendaService = inject(TiendaService);

  datos: CategoriaTienda[] = [];
  objetoActivo: ObjetoTienda | null = null;
  objetoFijado: ObjetoTienda | null = null;
  confirmandoCompra: boolean = false;
  monedas: number = 0;
  
  mensajeResultado: string | null = null;
  esError: boolean = false;

  ngOnInit() {
    this.cargarTienda();
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