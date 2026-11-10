import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cultivo, CultivoSolicitud, GrupoCum } from '../models/api.models';
import { ApiService } from './api.service';

/** Catálogo de cultivos (consulta) y su administración (US30, US31). */
@Injectable({ providedIn: 'root' })
export class CultivoService {
  private readonly api = inject(ApiService);

  listarActivos(): Observable<Cultivo[]> {
    return this.api.get<Cultivo[]>('/cultivos');
  }

  obtener(id: number): Observable<Cultivo> {
    return this.api.get<Cultivo>(`/cultivos/${id}`);
  }

  gruposCum(): Observable<GrupoCum[]> {
    return this.api.get<GrupoCum[]>('/grupos-cum');
  }

  // ---------- Administración (solo ADMIN) ----------
  listarTodos(): Observable<Cultivo[]> {
    return this.api.get<Cultivo[]>('/admin/cultivos');
  }

  registrar(datos: CultivoSolicitud): Observable<Cultivo> {
    return this.api.post<Cultivo>('/admin/cultivos', datos);
  }

  actualizar(id: number, datos: CultivoSolicitud): Observable<Cultivo> {
    return this.api.put<Cultivo>(`/admin/cultivos/${id}`, datos);
  }

  cambiarEstado(id: number, activo: boolean): Observable<void> {
    return this.api.patch<void>(`/admin/cultivos/${id}/${activo ? 'activar' : 'desactivar'}`);
  }
}
