import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { initHistoria } from '../../../game/historiaConfig';
import { personajePorId } from '../../../game/data/personaje';
import { claseHeroePorHabilidadId } from '../../../game/data/habilidades';

export interface Personaje {
  heroeId: string;
  spriteKey: string;
}

@Injectable({
  providedIn: 'root',
})
export class HistoriaService {
  private juegoInstance: any = null;
  private heroeIdSeleccionado: number | null = null;
  private habilidadSeleccionada: string | null = null;
  private spriteKeyBD: string | null = null;

  private apiUrl = '/api/Historia';

  private cambiarSkinSource = new Subject<string>();
  cambiarSkin$ = this.cambiarSkinSource.asObservable();

  private readonly escenasMapa = [
    'MapaPrincipal',
    'MapaAventura1',
    'MapaAventura2',
    'MapaAventura3',
    'InteriorCasaScene',
    'InteriorPulperiaScene',
  ];

  constructor(private http: HttpClient) {}

  verificarPersonajeBD(): Observable<{ tienePersonaje: boolean }> {
    return this.http.get<{ tienePersonaje: boolean }>(`${this.apiUrl}/verificarPersonaje`);
  }

  obtenerPersonajeBD(): Observable<Personaje> {
    return this.http.get<Personaje>(`${this.apiUrl}/obtenerPersonaje`);
  }

  guardarPersonajeBD(habilidadId: string, spriteKey: string): Observable<any> {
    const body = {
      HeroeId: habilidadId,
      SpriteKey: spriteKey,
    };

    console.log('Enviando este objeto al backend:', body);
    return this.http.post(`${this.apiUrl}/crearPersonaje`, body);
  }

  setHeroeSeleccionado(id: number): void {
    this.heroeIdSeleccionado = id;
  }

  setHabilidadSeleccionada(habilidad: string): void {
    this.habilidadSeleccionada = habilidad;
  }

  cargarPersonajeExistente(habilidadId: string, spriteKey: string): void {
    this.habilidadSeleccionada = habilidadId;
    this.spriteKeyBD = spriteKey;
  }

  obtenerSpriteKey(): string {
    if (this.spriteKeyBD) {
      return this.spriteKeyBD;
    }

    if (this.heroeIdSeleccionado !== null) {
      const heroe = personajePorId(this.heroeIdSeleccionado);
      if (heroe && heroe.spriteKey) {
        return heroe.spriteKey;
      }
    }
    return 'personaje';
  }

  iniciarJuego(contenedorId: string, salaService: any, uiService: any): void {
    if (this.juegoInstance) {
      this.destruirJuego();
    }

    this.obtenerPersonajeBD().subscribe({
      next: (personaje) => {
        this.cargarPersonajeExistente(personaje.heroeId, personaje.spriteKey);
        this.ejecutarInicioJuego(contenedorId, salaService, uiService);
      },
      error: (err) => {
        console.warn('No se pudo recuperar el personaje desde el backend, usando valores por defecto:', err);
        this.ejecutarInicioJuego(contenedorId, salaService, uiService);
      }
    });
  }

  private ejecutarInicioJuego(contenedorId: string, salaService: any, uiService: any): void {
    this.juegoInstance = initHistoria(contenedorId, salaService, uiService);

    const spriteKey = this.obtenerSpriteKey();
    const claseHeroe = this.habilidadSeleccionada
      ? claseHeroePorHabilidadId(this.habilidadSeleccionada)
      : null;

    this.juegoInstance.registry.set('playerSprite', spriteKey);
    this.juegoInstance.registry.set('playerAbility', this.habilidadSeleccionada ?? 'Ninguna');
    this.juegoInstance.registry.set('claseHeroe', claseHeroe);
  }

  obtenerJuego(): any {
    return this.juegoInstance;
  }

  destruirJuego(): void {
    if (this.juegoInstance) {
      this.juegoInstance.destroy(true);
      this.juegoInstance = null;
    }
  }

  equiparSkinDesdeArmario(spriteKey: string): void {
    if (this.juegoInstance) {
      this.juegoInstance.registry.set('playerSprite', spriteKey);
    }
    const evento = new CustomEvent('phaser:cambiarSkin', { detail: spriteKey });
    window.dispatchEvent(evento);
    this.cambiarSkinSource.next(spriteKey);
  }

  pausarEscena(key: string): void {
    this.juegoInstance?.scene.pause(key);
  }

  reanudarEscena(key: string): void {
    this.juegoInstance?.scene.resume(key);
  }

  obtenerEscenaMapaActiva(): string {
    if (this.juegoInstance) {
      for (const key of this.escenasMapa) {
        const scene = this.juegoInstance.scene.getScene(key);
        if (scene?.scene?.isActive()) return key;
      }
    }
    return localStorage.getItem('historiaMapaEscena') ?? 'MapaAventura1';
  }

  pausarEscenaMapaActiva(): void {
    const key = this.obtenerEscenaMapaActiva();
    localStorage.setItem('historiaMapaEscena', key);
    this.pausarEscena(key);
  }

  reanudarEscenaMapaTrasCombate(): void {
    const key = localStorage.getItem('historiaMapaEscena') ?? this.obtenerEscenaMapaActiva();
    localStorage.removeItem('historiaMapaEscena');
    this.reanudarEscena(key);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
  }
}