# AgroCrew · Frontend (Angular)

Aplicación web de **AgroCrew** para productores, asesores y administradores. Consume la API REST del backend
(Spring Boot) y aplica la guía de estilo del informe (sección 3.1): un solo color de marca `#2F5D3A`,
fuentes del sistema, tarjetas reutilizables y un único punto de quiebre a 768 px.

| | |
|---|---|
| **Curso** | Arquitectura de Aplicaciones Web (SI705) · UPC · 2026-20 |
| **Sprint** | Sprint 3 (TF) · TS19 |
| **Backend** | `Agrocrew-backend` (Swagger en `http://localhost:8080/swagger-ui.html`) |

## Requisitos

- Node.js 22 o superior (probado con Node 24) y npm.
- Angular CLI 22: `npm install -g @angular/cli`
- El backend corriendo en `http://localhost:8080` (desde IntelliJ: `AgrocrewApplication`).

## Ejecutar en local

```bash
npm install
ng serve
```

Abre **http://localhost:4200**. El backend ya permite este origen en CORS (`CORS_ORIGINS`).

Usuarios de prueba (si se cargaron los datos de la guía de pruebas):

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@agrocrew.pe` | `Admin12345` |
| Productor | `jose.rivera@test.com` | `clave1234` |

## Otros comandos

| Comando | Para qué sirve |
|---|---|
| `ng build` | Compila para producción en `dist/agrocrew-frontend` (usa `environment.prod.ts`). |
| `ng test --watch=false` | Ejecuta las pruebas unitarias (Vitest). |

## Variables de entorno

La URL de la API está en `src/environments/`:

| Archivo | Se usa en | `apiUrl` |
|---|---|---|
| `environment.ts` | `ng serve` (desarrollo) | `http://localhost:8080/api/v1` |
| `environment.prod.ts` | `ng build` (producción) | URL de AWS. Cambiarla por la URL **https** de CloudFront (T67) antes de publicar. |

Al publicar el front (T64) hay que agregar su dominio en la variable `CORS_ORIGINS` de Elastic Beanstalk.
Si el front se publica con `https://`, la API también debe tener HTTPS; si no, el navegador bloquea las llamadas.

## Estructura de carpetas

```
src/
├── environments/            URL de la API por entorno
├── styles.scss              Estilos globales: colores (variables CSS), tipografía, botones, tarjetas, formularios
├── styles/_variables.scss   Variables SCSS de la guía de estilo y el mixin del quiebre a 768 px
└── app/
    ├── core/                Lo que se usa en toda la app (una sola instancia)
    │   ├── models/          Tipos de la API (api.models.ts) y textos en lenguaje sencillo (etiquetas.ts)
    │   ├── services/        Un servicio por módulo de la API + sesión, notificaciones y confirmación
    │   ├── interceptors/    Token JWT en cada llamada, cierre de sesión ante 401 y mensajes de error claros
    │   └── guards/          Acceso por sesión y por rol (PRODUCTOR, ASESOR, ADMIN)
    ├── shared/              Componentes reutilizables: aviso, tarjeta, botón, diálogo, mapa (Leaflet),
    │                        gráfico de barras, paginador; pipe de etiquetas; utilidades de formularios y CSV
    ├── layout/              Cabecera con menú ☰ y contador de alertas, pie de página, notificaciones
    └── features/            Pantallas por módulo
        ├── auth/            Acceso (login y registro), recuperar y restablecer contraseña
        ├── perfil/          Mi perfil
        ├── predios/         Mis predios, registro/edición (ubigeo, mapa, código catastral) y detalle
        ├── evaluaciones/    Evaluar, resultado, ranking, factores, rentabilidad, calificación e historial
        ├── alertas/         Mis alertas
        ├── mapa-riesgo/     Puntos críticos de la ANA en el mapa
        ├── dashboard/       Dashboard por zona (asesor y administrador) con mapa de calor y CSV
        └── admin/           Usuarios, cultivos y datos económicos (administrador)
```

## Pantallas y rutas

| Ruta | Rol | Historias |
|---|---|---|
| `/acceso` | Público | US01, US02 |
| `/recuperar`, `/restablecer?token=` | Público | US05 |
| `/perfil` | Todos | US04 |
| `/predios`, `/predios/nuevo`, `/predios/:id/editar` | Productor | US06–US10, US07 |
| `/predios/:id` | Productor | US11–US14, US18, US23, US24 |
| `/evaluaciones/:id` | Productor | US18–US23, US25 |
| `/alertas` | Productor | US15, US16 |
| `/mapa` | Productor | US17 |
| `/dashboard` | Asesor, Admin | US26–US29, US34 |
| `/admin/usuarios`, `/admin/cultivos`, `/admin/datos-economicos` | Admin | US30–US33 |

## Decisiones técnicas

- **Angular 22 con componentes standalone y signals**, sin zone.js. Cada pantalla se carga solo al visitarla (carga diferida), lo que ayuda en conexiones rurales.
- **Sin librerías visuales pesadas**: los estilos son propios y los gráficos se hacen con HTML/CSS. El único paquete visual es **Leaflet** con OpenStreetMap (y `leaflet.heat` para el mapa de calor).
- **Accesibilidad**: contraste AA, unidades `rem`, títulos semánticos, `aria-expanded` en menús y desplegables, mensajes de error con `role="alert"` y enlace «Saltar al contenido».
- **Errores**: el interceptor convierte cualquier error en un mensaje claro (400, 403, 404, 409, 503 y sin conexión) y, ante un 401, cierra la sesión y vuelve al inicio de sesión.
- **Modo oscuro**: botón ☀/🌙 en la cabecera. Los colores son variables CSS en `styles.scss` (`:root` y `:root[data-theme='dark']`); la elección se guarda en el navegador y, si no hay ninguna, se sigue la del sistema.
- **Idioma español / inglés**: botón EN/ES en la cabecera. Los textos se escriben en español en las plantillas con el pipe `t` (`{{ 'Mis predios' | t }}`) y su traducción está en `core/i18n/textos.en.ts`. Los mensajes fijos del backend (errores, validaciones, grupos de suelo, factores) se traducen con el pipe `tApi` (`core/i18n/textos-api.en.ts`). La explicación automática del backend solo existe en español; con la IA (Gemini) configurada llega en inglés gracias al header `Accept-Language`.
- **Notificaciones con `ngx-sonner`**: port para Angular de Sonner (Emil Kowalski). Se apilan, se expanden al pasar el cursor y se descartan deslizándolas; usan los colores de la guía y siguen el modo claro u oscuro. Las pantallas las llaman mediante `NotificacionService`.
- **Animaciones sutiles**: entrada de páginas, tarjetas que se elevan, barras y medidores que se dibujan, esqueletos de carga y transiciones entre pantallas. Se desactivan solas si el sistema pide «reducir movimiento» (`prefers-reduced-motion`).

### Agregar un texto traducible

1. En la plantilla: `{{ 'Texto en español' | t }}` (o en TypeScript: `t('Texto en español')`).
2. En `src/app/core/i18n/textos.en.ts`: `'Texto en español': 'English text',`.
3. Si lleva datos: `{{ 'Hola, {nombre}' | t: { nombre: usuario.nombres } }}` y en el diccionario `'Hola, {nombre}': 'Hi, {nombre}'`.
