import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CategoriaTienda } from '../../../interfaces/categoriaTienda';
import { ObjetoTienda } from '../../../interfaces/ObjetoTienda';

@Component({
  selector: 'app-tienda-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tienda-overlay.html',
  styleUrls: ['./tienda-overlay.css'],
})
export class TiendaOverlayComponent implements OnInit {
  private http = inject(HttpClient);

  datos: CategoriaTienda[] = [];
  objetoActivo: ObjetoTienda | null = null;
  objetoFijado: ObjetoTienda | null = null;
  confirmandoCompra: boolean = false;

  ngOnInit() {
    this.cargarTienda();
  }

  cargarTienda() {
    this.http.get<CategoriaTienda[]>('/api/tienda').subscribe({
      next: (res) => {
        this.datos = res;
      },
      error: (err) => console.error('Error al cargar la tienda', err),
    });
  }

  mostrarInfo(objeto: ObjetoTienda) {
    if (this.objetoFijado) return;

    if (this.objetoActivo !== objeto) {
      this.objetoActivo = objeto;
      this.confirmandoCompra = false;
    }
  }

  seleccionarObjeto(objeto: ObjetoTienda) {
    if (this.objetoFijado === objeto) {
      this.liberarSeleccion();
    } else {
      this.objetoFijado = objeto;
      this.objetoActivo = objeto;
      this.confirmandoCompra = false;
    }
  }

  liberarSeleccion() {
    this.objetoFijado = null;
    this.confirmandoCompra = false;
  }

  cancelarCompra() {
    this.confirmandoCompra = false;
  }

  confirmarAccionCompra() {
    if (this.objetoActivo) {
      console.log(`¡Compra confirmada!: ${this.objetoActivo.nombre} (Mentira)`);
      this.liberarSeleccion();
    }
  }
}
