import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoriaService } from '../../../services/historia/historia-service';
import { InventarioService } from '../../../services/inventario/inventario-service';

@Component({
  selector: 'app-inventario-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventario-overlay.html',
  styleUrl: './inventario-overlay.css',
})
export class InventarioOverlay {
  inventarioCompleto: any[] = [];
  categoriaActiva: string = 'TODO';
  totalSlots: number = 12;
  itemPorEquipar: any = null;
  monedas: number = 0;

  constructor(
    private historiaService: HistoriaService,
    private inventarioService: InventarioService,
  ) {}

  ngOnInit() {
    this.inventarioService.obtenerInventario().subscribe({
      next: (resultado) => {
        this.inventarioCompleto = resultado.items || resultado.Items || [];
        this.monedas = resultado.monedas || resultado.Monedas || 0;
      },
      error: (error) => console.error('Error al obtener el inventario:', error),
    });
  }

  seleccionarCategoria(categoria: string) {
    this.categoriaActiva = categoria;
  }

  seleccionarItem(item: any) {
    const itemTienda = item.itemTienda;
    if (itemTienda && itemTienda.categoria === 'ARMARIO' && itemTienda.spriteKey) {
      this.itemPorEquipar = itemTienda;
    }
  }

  confirmarEquipacion() {
    if (this.itemPorEquipar) {
      this.historiaService.equiparSkinDesdeArmario(this.itemPorEquipar.spriteKey);
    }
    this.itemPorEquipar = null;
  }

  cancelarEquipacion() {
    this.itemPorEquipar = null;
  }

  get itemsFiltrados() {
    if (this.categoriaActiva === 'TODO') {
      return this.inventarioCompleto;
    }
    return this.inventarioCompleto.filter(
      (linea) => linea.itemTienda?.categoria === this.categoriaActiva,
    );
  }

  get slotsVacios() {
    const cantidadItemsFiltrados = this.itemsFiltrados.length;
    const faltantes = this.totalSlots - cantidadItemsFiltrados;
    return faltantes > 0 ? new Array(faltantes) : [];
  }
}
