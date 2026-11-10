import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  DatoEconomico, DatoEconomicoSolicitud, PerfilSolicitud, Rol, Usuario,
} from '../models/api.models';
import { ApiService } from './api.service';

/** Perfil propio (US04), administración de usuarios (US33) y datos económicos (US32). */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly api = inject(ApiService);

  perfil(): Observable<Usuario> {
    return this.api.get<Usuario>('/usuarios/me');
  }

  actualizarPerfil(datos: PerfilSolicitud): Observable<Usuario> {
    return this.api.put<Usuario>('/usuarios/me', datos);
  }

  // ---------- Administración (solo ADMIN) ----------
  listarTodos(): Observable<Usuario[]> {
    return this.api.get<Usuario[]>('/admin/usuarios');
  }

  cambiarRol(id: number, rol: Rol): Observable<Usuario> {
    return this.api.patch<Usuario>(`/admin/usuarios/${id}/rol`, { rol });
  }

  cambiarEstado(id: number, activo: boolean): Observable<Usuario> {
    return this.api.patch<Usuario>(`/admin/usuarios/${id}/${activo ? 'activar' : 'desactivar'}`);
  }

  listarDatosEconomicos(cultivoId?: number | null, departamentoId?: number | null): Observable<DatoEconomico[]> {
    return this.api.get<DatoEconomico[]>('/admin/datos-economicos', { cultivoId, departamentoId });
  }

  registrarDatoEconomico(datos: DatoEconomicoSolicitud): Observable<DatoEconomico> {
    return this.api.post<DatoEconomico>('/admin/datos-economicos', datos);
  }

  actualizarDatoEconomico(id: number, datos: DatoEconomicoSolicitud): Observable<DatoEconomico> {
    return this.api.put<DatoEconomico>(`/admin/datos-economicos/${id}`, datos);
  }
}
