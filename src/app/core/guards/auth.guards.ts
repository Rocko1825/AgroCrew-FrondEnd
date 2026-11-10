import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../models/api.models';
import { AuthService } from '../services/auth.service';

/** Solo usuarios con sesión; si no, va al inicio de sesión y luego vuelve a la página pedida. */
export const autenticadoGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService);
  if (auth.token) {
    return true;
  }
  return inject(Router).createUrlTree(['/acceso'], { queryParams: { volver: estado.url } });
};

/**
 * Guard por rol (T62). Si el rol no corresponde, redirige al panel de su propio rol.
 * Uso en rutas: canActivate: [rolGuard('PRODUCTOR')]
 */
export function rolGuard(...roles: Rol[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const rol = auth.rol();
    if (rol && roles.includes(rol)) {
      return true;
    }
    return inject(Router).parseUrl(auth.rutaInicio(rol));
  };
}

/** Las páginas de acceso solo se muestran sin sesión; con sesión se va al panel del rol. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.token ? inject(Router).parseUrl(auth.rutaInicio()) : true;
};

/** Ruta raíz: redirige al panel según el rol del token. */
export const inicioGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return inject(Router).parseUrl(auth.token ? auth.rutaInicio() : '/acceso');
};
