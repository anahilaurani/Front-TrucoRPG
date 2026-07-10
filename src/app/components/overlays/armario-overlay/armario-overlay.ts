import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoriaService } from '../../../services/historia/historia-service';
import { InventarioService } from '../../../services/inventario/inventario-service';

@Component({
  selector: 'app-armario-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './armario-overlay.html',
  styleUrl: './armario-overlay.css'
})
export class ArmarioOverlay implements OnInit {
  itemsArmario: any[] = [];
  
  personajeBase: string = 'personaje1'; 
  assetActual: string = 'personaje1'; 
  assetPreview: string = 'personaje1'; 
  
  itemFijado: any = null;
  itemEnHover: any = null;
  
  cargando: boolean = false;

  constructor(
    private historiaService: HistoriaService,
    private inventarioService: InventarioService
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.historiaService.obtenerPersonajeBD().subscribe({
      next: (personaje) => {
        const rawKey = personaje.spriteKey || 'personaje1';
        this.assetActual = rawKey.replace('.png', '');
        this.actualizarPreview();

        const match = this.assetActual.match(/personaje\d+/);
        this.personajeBase = match ? match[0] : 'personaje1';
      },
      error: (err) => console.error('Error al obtener personaje base:', err)
    });

    this.inventarioService.obtenerInventario().subscribe({
      next: (resultado) => {
        const todosLosItems = resultado.items || resultado.Items || [];
        this.itemsArmario = todosLosItems.filter(
          (linea: any) => linea.itemTienda?.categoria === 'ARMARIO'
        );
      },
      error: (err) => console.error('Error al obtener inventario para armario:', err)
    });
  }

  hoverItem(linea: any) {
    this.itemEnHover = linea.itemTienda;
    this.actualizarPreview();
  }

  unhoverItem() {
    this.itemEnHover = null;
    this.actualizarPreview();
  }

  fijarItem(linea: any) {
    this.itemFijado = linea.itemTienda;
    this.actualizarPreview();
  }

  hoverDefault() {
    this.itemEnHover = { isDefault: true };
    this.actualizarPreview();
  }

  fijarDefault() {
    this.itemFijado = { isDefault: true };
    this.actualizarPreview();
  }

  actualizarPreview() {
    const itemActivo = this.itemEnHover || this.itemFijado;

    if (!itemActivo) {
      this.assetPreview = this.assetActual;
      return;
    }

    if (itemActivo.isDefault) {
      this.assetPreview = this.personajeBase;
      return;
    }

    // El tinte solo aporta el color: se aplica siempre sobre el personaje base.
    // Se tolera data vieja donde spriteKey venía como "personaje1rosa".
    const itemKey = itemActivo.spriteKey || '';
    const color = itemKey.replace(/personaje\d+/, '');
    this.assetPreview = color ? `${this.personajeBase}${color}` : this.personajeBase;
  }

  onPreviewError() {
    // Si no existe la variante de color para este personaje, se muestra el base.
    if (this.assetPreview !== this.personajeBase) {
      this.assetPreview = this.personajeBase;
    }
  }

  obtenerRutaPreviewGrande(): string {
    return `Imagenes/avatares/${this.assetPreview}.png`;
  }

  confirmarEquipacion() {
    if (this.cargando) return;
    this.cargando = true;

    const assetFinal = this.assetPreview;
    this.historiaService.equiparSkinDesdeArmario(assetFinal, assetFinal);

    this.assetActual = assetFinal;
    this.itemFijado = null;
    this.itemEnHover = null;
    this.cargando = false;
  }

  cancelarCambios() {
    this.itemFijado = null;
    this.itemEnHover = null;
    this.assetPreview = this.assetActual;
  }
}