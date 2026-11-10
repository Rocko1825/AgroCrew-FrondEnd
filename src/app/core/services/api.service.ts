import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

type Parametros = Record<string, string | number | boolean | null | undefined>;

/**
 * Servicio HTTP base (T63): arma la URL con environment.apiUrl y omite los parámetros vacíos.
 * El token y el manejo de errores los agregan los interceptores.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  get<T>(ruta: string, parametros?: Parametros): Observable<T> {
    return this.http.get<T>(this.base + ruta, { params: this.params(parametros) });
  }

  post<T>(ruta: string, cuerpo: unknown = {}): Observable<T> {
    return this.http.post<T>(this.base + ruta, cuerpo);
  }

  put<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.put<T>(this.base + ruta, cuerpo);
  }

  patch<T>(ruta: string, cuerpo: unknown = {}): Observable<T> {
    return this.http.patch<T>(this.base + ruta, cuerpo);
  }

  delete<T>(ruta: string): Observable<T> {
    return this.http.delete<T>(this.base + ruta);
  }

  private params(parametros?: Parametros): HttpParams {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(parametros ?? {})) {
      if (valor !== null && valor !== undefined && valor !== '') {
        params = params.set(clave, String(valor));
      }
    }
    return params;
  }
}
