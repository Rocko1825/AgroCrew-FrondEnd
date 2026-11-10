import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IDIOMA, t, tApi } from '../i18n/idioma';
import { ErrorApi } from '../models/api.models';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor JWT (T61) y manejo uniforme de errores (T63):
 * - Envía el token en cada llamada a la API (menos en /auth, que es pública).
 * - Envía el idioma (Accept-Language): con IA configurada, la explicación llega en inglés.
 * - Ante un 401 (token vencido) cierra la sesión y vuelve al inicio de sesión.
 * - Convierte cualquier error en un ErrorApi con un mensaje claro, en el idioma elegido.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const esApi = req.url.startsWith(environment.apiUrl);
  const esAuth = req.url.startsWith(environment.apiUrl + '/auth/');

  const token = esApi && !esAuth ? auth.token : null;
  const cabeceras: Record<string, string> = esApi ? { 'Accept-Language': IDIOMA } : {};
  if (token) {
    cabeceras['Authorization'] = `Bearer ${token}`;
  }
  const solicitud = Object.keys(cabeceras).length ? req.clone({ setHeaders: cabeceras }) : req;

  return next(solicitud).pipe(
    catchError((e: HttpErrorResponse) => {
      if (e.status === 401 && esApi && !esAuth) {
        auth.cerrarSesion('expirada');
      }
      return throwError(() => normalizarError(e));
    }),
  );
};

const MENSAJES_POR_ESTADO: Record<number, string> = {
  0: 'No pudimos conectarnos con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.',
  400: 'Revisa los datos ingresados.',
  401: 'Tu sesión venció. Vuelve a iniciar sesión.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'No encontramos lo que buscas.',
  409: 'Ese registro ya existe.',
  410: 'El enlace expiró.',
  500: 'Ocurrió un error inesperado. Inténtalo nuevamente.',
  503: 'Un servicio externo no está disponible por ahora. Inténtalo en unos minutos.',
};

export function normalizarError(e: HttpErrorResponse): ErrorApi {
  const cuerpo = e.error && typeof e.error === 'object' ? (e.error as Partial<ErrorApi>) : null;
  const detalles = cuerpo?.detalles
    ? Object.fromEntries(Object.entries(cuerpo.detalles).map(([campo, msg]) => [campo, tApi(msg)]))
    : undefined;
  return {
    estado: e.status,
    mensaje: cuerpo?.mensaje ? tApi(cuerpo.mensaje) : t(MENSAJES_POR_ESTADO[e.status] ?? MENSAJES_POR_ESTADO[500]),
    detalles,
    ruta: cuerpo?.ruta,
  };
}

/** Mensaje para mostrar a partir de cualquier error capturado en un componente. */
export function mensajeError(error: unknown): string {
  if (error && typeof error === 'object' && 'mensaje' in error) {
    return String((error as ErrorApi).mensaje);
  }
  return t(MENSAJES_POR_ESTADO[500]);
}

export function estadoError(error: unknown): number {
  return error && typeof error === 'object' && 'estado' in error ? Number((error as ErrorApi).estado) : 500;
}
