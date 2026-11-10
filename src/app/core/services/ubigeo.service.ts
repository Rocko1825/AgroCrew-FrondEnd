import { inject, Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { Ubigeo } from '../models/api.models';
import { ApiService } from './api.service';

/** Combos encadenados departamento → provincia → distrito (US06, T76). Guarda en memoria lo consultado. */
@Injectable({ providedIn: 'root' })
export class UbigeoService {
  private readonly api = inject(ApiService);
  private readonly cache = new Map<string, Ubigeo[]>();

  departamentos(): Observable<Ubigeo[]> {
    return this.conCache('dep', () => this.api.get<Ubigeo[]>('/ubigeo/departamentos'));
  }

  provincias(departamentoId: number): Observable<Ubigeo[]> {
    return this.conCache('prov-' + departamentoId,
      () => this.api.get<Ubigeo[]>(`/ubigeo/departamentos/${departamentoId}/provincias`));
  }

  distritos(provinciaId: number): Observable<Ubigeo[]> {
    return this.conCache('dist-' + provinciaId,
      () => this.api.get<Ubigeo[]>(`/ubigeo/provincias/${provinciaId}/distritos`));
  }

  private conCache(clave: string, consulta: () => Observable<Ubigeo[]>): Observable<Ubigeo[]> {
    const guardado = this.cache.get(clave);
    return guardado ? of(guardado) : consulta().pipe(tap((l) => this.cache.set(clave, l)));
  }
}
