import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class InventarioService {

  private apiUrl = `${environment.apiUrl}/api/Inventario`;

  constructor(private http: HttpClient) {}

  obtenerInventario(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/miInventario`);
  }
}
