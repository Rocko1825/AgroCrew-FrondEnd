# AgroCrew · Frontend

**AgroCrew** es una plataforma web que evalúa la aptitud agrícola de terrenos cruzando datos de MIDAGRI, ANA y Open-Meteo con apoyo de inteligencia artificial. Este repositorio contiene la **aplicación web en Angular** que usan productores, asesores y administradores para registrar predios, evaluar cultivos, revisar alertas y consultar reportes.

> El backend (API REST) vive en un repositorio separado y no forma parte de este proyecto.

## Contexto académico

| | |
|---|---|
| **Curso** | 1ASI0705 · Arquitectura de Aplicaciones Web |
| **Universidad** | Universidad Peruana de Ciencias Aplicadas (UPC) |
| **Ciclo** | 202620 |
| **Docente** | Elio Jefferrson Navarrete Vilca |

## Tecnologías

Versiones declaradas en `package.json`:

| Paquete | Versión | Uso |
|---|---|---|
| `@angular/core`, `common`, `compiler`, `forms`, `platform-browser`, `router` | ^22.1.0 | Framework (componentes standalone, signals, router) |
| `@angular/cli`, `@angular/build` | ^22.1.5 | CLI, servidor de desarrollo y build |
| `typescript` | ~6.0.2 | Lenguaje |
| `rxjs` | ~7.8.0 | Programación reactiva / HTTP |
| `leaflet` · `leaflet.heat` | ^1.9.4 · ^0.2.0 | Mapas (OpenStreetMap) y mapa de calor |
| `chart.js` | ^4.6.1 | Gráficos |
| `motion` | ^14.10.1 | Animaciones |
| `ngx-sonner` | ^3.1.0 | Notificaciones (toasts) |
| `vitest` · `jsdom` | ^4.0.8 · ^28.0.0 | Pruebas unitarias |
| `prettier` | ^3.8.1 | Formato de código (`.prettierrc`) |

Los estilos usan SCSS (`src/styles.scss` y `src/styles/_variables.scss`).

> Angular Material está planificado, pero todavía no figura en `package.json`. TODO: actualizar esta tabla al instalarlo (`ng add @angular/material`).

## Estructura del proyecto

```
src/
├── main.ts                 Punto de entrada de la aplicación
├── index.html              Página HTML base
├── styles.scss             Estilos globales (variables CSS, tipografía, componentes base, modo oscuro)
├── styles/                 Variables y mixins SCSS de la guía de estilo
├── environments/           Configuración por entorno (URL base de la API)
└── app/
    ├── app.ts / app.config.ts / app.routes.ts   Componente raíz, providers y rutas
    ├── core/               Servicios únicos de la app
    │   ├── guards/         Protección de rutas por sesión y por rol
    │   ├── i18n/           Traducciones español / inglés
    │   ├── interceptors/   Envío del token JWT y manejo centralizado de errores HTTP
    │   ├── models/         Tipos de la API y etiquetas en lenguaje sencillo
    │   └── services/       Servicios por módulo de la API, sesión, tema y notificaciones
    ├── shared/             Elementos reutilizables
    │   ├── components/     Tarjeta, botón, aviso, diálogo, mapa, gráfico, medidor, paginador, etc.
    │   ├── pipes/          Pipes de traducción (`t`) y de etiquetas
    │   └── utils/          Utilidades de formularios y exportación CSV
    ├── layout/             Cabecera y pie de página
    └── features/           Pantallas por módulo
        ├── auth/           Acceso, recuperación y restablecimiento de contraseña
        ├── perfil/         Perfil del usuario
        ├── predios/        Listado, registro/edición y detalle de predios
        ├── evaluaciones/   Evaluación, resultado, ranking, factores, rentabilidad, calificación e historial
        ├── alertas/        Alertas del productor
        ├── mapa-riesgo/    Mapa de puntos críticos
        ├── dashboard/      Indicadores por zona para asesores y administradores
        └── admin/          Gestión de usuarios, cultivos y datos económicos
public/                     Recursos estáticos (favicon, logo, fondos)
```

## Requisitos previos

| Herramienta | Versión |
|---|---|
| Node.js | TODO: `package.json` no declara `engines`; confirmar la versión mínima compatible con Angular 22 |
| npm | 12.0.2 (campo `packageManager` de `package.json`) |
| Angular CLI | 22 (`@angular/cli` ^22.1.5). Es opcional instalarlo globalmente (`npm install -g @angular/cli`); los scripts de npm usan la versión local. |

## Instalación y ejecución

```bash
git clone https://github.com/Rocko1825/AgroCrew-FrondEnd.git
cd AgroCrew-FrondEnd
npm install
npm start        # equivale a: ng serve
```

La aplicación queda disponible en **http://localhost:4200** (puerto por defecto de `ng serve`). El servidor de desarrollo usa la configuración `development`.

## Build y tests

| Comando | Descripción |
|---|---|
| `npm run build` | `ng build` con la configuración `production`. Genera `dist/agrocrew-frontend` y reemplaza `environment.ts` por `environment.prod.ts`. |
| `npm run watch` | `ng build --watch --configuration development`: recompila al guardar cambios. |
| `npm test` | `ng test`: ejecuta las pruebas unitarias con Vitest. Añade `-- --watch=false` para una sola ejecución. |

## Conexión con el backend

El backend de AgroCrew se encuentra en otro repositorio. TODO: agregar el enlace al repositorio del backend.

La URL base de la API se configura en la propiedad `apiUrl` de los archivos de `src/environments/`:

| Archivo | Se usa en | `apiUrl` |
|---|---|---|
| `environment.ts` | `npm start` / `ng serve` (desarrollo) | `http://localhost:8080/api/v1` |
| `environment.prod.ts` | `npm run build` (producción) | URL del backend desplegado en AWS |

El backend debe permitir por CORS el origen desde el que se sirve el frontend (en local, `http://localhost:4200`). TODO: reemplazar la URL de producción por la URL HTTPS definitiva de la API.

## Despliegue

TODO: URL pública del frontend desplegado.

## Integrantes

1. Axel Yerico De La Cruz Huamán
2. Adrian Eduardo Estrada Ochoa
3. Saul Lujan Chu
4. José Rivera Zelaya
5. Mauricio Leonardo Valverde Barrera
6. Ronaldo Torres Lizana
