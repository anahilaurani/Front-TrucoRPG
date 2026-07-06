import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TiendaService {

  private apiUrl = `${environment.apiUrl}/api/Tienda`;

  constructor(private http: HttpClient) {}

  cargarTienda(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  comprar(itemTiendaId: number): Observable<any> {
    const body = { itemTiendaId };
    return this.http.post<any>(`${this.apiUrl}/comprar`, body);
  }
}
