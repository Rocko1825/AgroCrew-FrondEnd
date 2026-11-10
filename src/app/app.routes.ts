import { Routes } from '@angular/router';
import { autenticadoGuard, inicioGuard, invitadoGuard, rolGuard } from './core/guards/auth.guards';

/**
 * Rutas por rol (T60, T62). Cada pantalla se carga solo cuando se visita (carga diferida),
 * lo que reduce el consumo de datos en conexiones rurales.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', canActivate: [inicioGuard], children: [] },

  // ---------- Acceso (público) ----------
  {
    path: 'acceso', title: 'Acceso · AgroCrew', canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/acceso/acceso').then((m) => m.Acceso),
  },
  {
    path: 'recuperar', title: 'Recuperar contraseña · AgroCrew', canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/recuperar/recuperar').then((m) => m.Recuperar),
  },
  {
    path: 'restablecer', title: 'Nueva contraseña · AgroCrew',
    loadComponent: () => import('./features/auth/restablecer/restablecer').then((m) => m.Restablecer),
  },

  // ---------- Con sesión ----------
  {
    path: '',
    canActivate: [autenticadoGuard],
    children: [
      {
        path: 'perfil', title: 'Mi perfil · AgroCrew',
        loadComponent: () => import('./features/perfil/perfil').then((m) => m.Perfil),
      },

      // Productor
      {
        path: 'predios', title: 'Mis predios · AgroCrew', canActivate: [rolGuard('PRODUCTOR')],
        loadComponent: () => import('./features/predios/mis-predios/mis-predios').then((m) => m.MisPredios),
      },
      {
        path: 'predios/nuevo', title: 'Registrar predio · AgroCrew', canActivate: [rolGuard('PRODUCTOR')],
        loadComponent: () => import('./features/predios/predio-form/predio-form').then((m) => m.PredioForm),
      },
      {
        path: 'predios/:id', title: 'Mi predio · AgroCrew', canActivate: [rolGuard('PRODUCTOR')],
        loadComponent: () => import('./features/predios/predio-detalle/predio-detalle').then((m) => m.PredioDetalle),
      },
      {
        path: 'predios/:id/editar', title: 'Editar predio · AgroCrew', canActivate: [rolGuard('PRODUCTOR')],
        loadComponent: () => import('./features/predios/predio-form/predio-form').then((m) => m.PredioForm),
      },
      {
        path: 'evaluaciones/:id', title: 'Resultado de la evaluación · AgroCrew', canActivate: [rolGuard('PRODUCTOR')],
        loadComponent: () =>
          import('./features/evaluaciones/resultado/resultado-evaluacion').then((m) => m.ResultadoEvaluacion),
      },
      {
        path: 'alertas', title: 'Alertas · AgroCrew', canActivate: [rolGuard('PRODUCTOR')],
        loadComponent: () => import('./features/alertas/mis-alertas').then((m) => m.MisAlertas),
      },
      {
        path: 'mapa', title: 'Mapa de riesgo · AgroCrew', canActivate: [rolGuard('PRODUCTOR')],
        loadComponent: () => import('./features/mapa-riesgo/mapa-riesgo').then((m) => m.MapaRiesgo),
      },

      // Asesor y administrador
      {
        path: 'dashboard', title: 'Dashboard por zona · AgroCrew', canActivate: [rolGuard('ASESOR', 'ADMIN')],
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },

      // Administrador
      {
        path: 'admin/usuarios', title: 'Usuarios · AgroCrew', canActivate: [rolGuard('ADMIN')],
        loadComponent: () => import('./features/admin/usuarios/admin-usuarios').then((m) => m.AdminUsuarios),
      },
      {
        path: 'admin/cultivos', title: 'Cultivos · AgroCrew', canActivate: [rolGuard('ADMIN')],
        loadComponent: () => import('./features/admin/cultivos/admin-cultivos').then((m) => m.AdminCultivos),
      },
      {
        path: 'admin/cultivos/nuevo', title: 'Registrar cultivo · AgroCrew', canActivate: [rolGuard('ADMIN')],
        loadComponent: () => import('./features/admin/cultivos/cultivo-form').then((m) => m.CultivoForm),
      },
      {
        path: 'admin/cultivos/:id', title: 'Editar cultivo · AgroCrew', canActivate: [rolGuard('ADMIN')],
        loadComponent: () => import('./features/admin/cultivos/cultivo-form').then((m) => m.CultivoForm),
      },
      {
        path: 'admin/datos-economicos', title: 'Datos económicos · AgroCrew', canActivate: [rolGuard('ADMIN')],
        loadComponent: () =>
          import('./features/admin/datos-economicos/admin-datos-economicos').then((m) => m.AdminDatosEconomicos),
      },
    ],
  },

  {
    path: 'privacidad', title: 'Política de privacidad · AgroCrew',
    loadComponent: () => import('./features/privacidad').then((m) => m.Privacidad),
  },

  {
    path: '**', title: 'Página no encontrada · AgroCrew',
    loadComponent: () => import('./features/no-encontrado').then((m) => m.NoEncontrado),
  },
];
