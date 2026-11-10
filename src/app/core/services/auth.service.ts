import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import {
  AuthRespuesta, Mensaje, RegistroSolicitud, Rol, Usuario,
} from '../models/api.models';
import { ApiService } from './api.service';

interface Sesion {
  token: string;
  expiraEn: number;
  usuario: Usuario;
}

const CLAVE_SESION = 'agrocrew.sesion';

/**
 * Sesión del usuario (T61): guarda el token JWT en el navegador, expone el usuario y su rol
 * como signals y cierra la sesión cuando el token vence.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly sesion = signal<Sesion | null>(this.leerSesion());

  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly rol = computed<Rol | null>(() => this.sesion()?.usuario.rol ?? null);
  readonly autenticado = computed(() => this.sesion() !== null);

  get token(): string | null {
    const s = this.sesion();
    if (s && Date.now() >= s.expiraEn) {
      this.limpiar();
      return null;
    }
    return s?.token ?? null;
  }

  login(email: string, password: string): Observable<AuthRespuesta> {
    return this.api.post<AuthRespuesta>('/auth/login', { email, password }).pipe(
      tap((r) => this.guardar({ token: r.token, expiraEn: Date.now() + r.expiraEnMs, usuario: r.usuario })),
    );
  }

  registrar(datos: RegistroSolicitud): Observable<Usuario> {
    return this.api.post<Usuario>('/auth/register', datos);
  }

  /** Cierra la sesión (US03) y vuelve al inicio de sesión. */
  cerrarSesion(motivo?: 'expirada'): void {
    this.limpiar();
    this.router.navigate(['/acceso'], { queryParams: motivo ? { sesion: motivo } : {} });
  }

  /** Actualiza los datos del usuario guardados tras editar el perfil (US04). */
  actualizarUsuario(usuario: Usuario): void {
    const s = this.sesion();
    if (s) {
      this.guardar({ ...s, usuario });
    }
  }

  /** Panel principal de cada rol (T62). */
  rutaInicio(rol: Rol | null = this.rol()): string {
    switch (rol) {
      case 'PRODUCTOR': return '/predios';
      case 'ASESOR':
      case 'ADMIN': return '/dashboard';
      default: return '/acceso';
    }
  }

  // ---------- Recuperación de contraseña (US05) ----------
  solicitarRecuperacion(email: string): Observable<Mensaje> {
    return this.api.post<Mensaje>('/auth/recuperar', { email });
  }

  validarEnlace(token: string): Observable<Mensaje> {
    return this.api.post<Mensaje>('/auth/restablecer/validar', { token });
  }

  restablecer(token: string, nuevaPassword: string): Observable<Mensaje> {
    return this.api.post<Mensaje>('/auth/restablecer', { token, nuevaPassword });
  }

  // ---------- Almacenamiento ----------
  private guardar(sesion: Sesion): void {
    this.sesion.set(sesion);
    try {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
      // Navegador sin almacenamiento disponible: la sesión dura mientras la pestaña esté abierta.
    }
  }

  private limpiar(): void {
    this.sesion.set(null);
    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch {
      // Sin almacenamiento: nada que borrar.
    }
  }

  private leerSesion(): Sesion | null {
    try {
      const guardada = localStorage.getItem(CLAVE_SESION);
      if (!guardada) {
        return null;
      }
      const sesion = JSON.parse(guardada) as Sesion;
      return sesion.token && Date.now() < sesion.expiraEn ? sesion : null;
    } catch {
      return null;
    }
  }
}
