import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { TPipe } from '../shared/pipes/t.pipe';

/* Datos de contacto y redes del equipo: reemplázalos por los reales antes de la entrega. */
const CORREO_CONTACTO = 'contacto@agrocrew.pe';
const TELEFONO_CONTACTO = '+51 900 000 000';
const REDES = [
  { nombre: 'Facebook', url: 'https://www.facebook.com/', icono: 'M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8z' },
  { nombre: 'Instagram', url: 'https://www.instagram.com/', icono: 'M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3zm4.5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.2-1.6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z' },
  { nombre: 'LinkedIn', url: 'https://www.linkedin.com/', icono: 'M4 9h3.6v11H4V9zm1.8-5.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM10 9h3.4v1.6c.5-.9 1.7-1.9 3.5-1.9 3.7 0 4.1 2.4 4.1 5.5V20h-3.6v-5.1c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V20H10V9z' },
  { nombre: 'YouTube', url: 'https://www.youtube.com/', icono: 'M21.6 7.2c-.2-.9-.9-1.6-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8c.2.9.9 1.6 1.8 1.8 1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3L10 15z' },
];

/** Pie de página: marca, categorías según el rol, contacto, redes y avisos legales (US21). */
@Component({
  selector: 'app-pie',
  imports: [RouterLink, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="pie">
      <div class="contenedor columnas">
        <div class="col-marca">
          <p class="marca"><img src="logo.svg" alt="" width="28" height="28"> <strong>AgroCrew</strong></p>
          <p class="texto">{{ 'Descubre qué cultivos son compatibles con tu terreno, con datos oficiales de suelo, clima y riesgo.' | t }}</p>
          <ul class="redes" [attr.aria-label]="'Redes sociales' | t">
            @for (r of redes; track r.nombre) {
              <li>
                <a [href]="r.url" target="_blank" rel="noopener" [attr.aria-label]="r.nombre" [title]="r.nombre">
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path [attr.d]="r.icono" fill="currentColor" fill-rule="evenodd" /></svg>
                </a>
              </li>
            }
          </ul>
        </div>

        <nav [attr.aria-label]="'Categorías' | t">
          <h2>{{ 'Categorías' | t }}</h2>
          <ul>
            @for (c of categorias(); track c.ruta) {
              <li><a [routerLink]="c.ruta">{{ c.texto | t }}</a></li>
            }
          </ul>
        </nav>

        <div>
          <h2>{{ 'Contacto' | t }}</h2>
          <ul>
            <li><a [href]="'mailto:' + correo">{{ correo }}</a></li>
            <li><a [href]="'tel:' + telefono.replace(' ', '')">{{ telefono }}</a></li>
            <li class="suave">{{ 'Lima, Perú' | t }}</li>
          </ul>
        </div>

        <div>
          <h2>{{ 'Legal' | t }}</h2>
          <ul>
            <li><a routerLink="/privacidad">{{ 'Política de privacidad' | t }}</a></li>
            <li><a routerLink="/privacidad" fragment="terminos">{{ 'Términos de uso' | t }}</a></li>
          </ul>
        </div>
      </div>

      <div class="contenedor base">
        <p>{{ 'Las recomendaciones de AgroCrew son referenciales: no reemplazan la evaluación de un ingeniero agrónomo ni garantizan el rendimiento de la cosecha.' | t }}</p>
        <p class="fila-base">
          <span>© 2026 AgroCrew · {{ 'Proyecto académico UPC · 2026' | t }}</span>
          <span>{{ 'Datos: MIDAGRI, ANA y Open-Meteo.' | t }}</span>
        </p>
      </div>
    </footer>
  `,
  styles: `
    .pie { background: var(--color-pie); color: #FFFFFF; padding: 48px 0 24px; transition: background-color 0.3s ease; }
    .columnas { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 32px; }
    h2 { color: #FFFFFF; font-size: 0.95rem; font-weight: 700; margin: 0 0 14px; letter-spacing: 0; }
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
    a { color: var(--color-gris-verdoso); text-decoration: none; font-size: 0.92rem; }
    a:hover, a:focus-visible { color: #FFFFFF; text-decoration: underline; text-underline-offset: 3px; }
    .suave { color: var(--color-gris-verdoso); font-size: 0.92rem; }
    .marca { display: inline-flex; align-items: center; gap: 8px; font-size: 1.15rem; margin: 0 0 10px; }
    .texto { color: var(--color-gris-verdoso); font-size: 0.92rem; max-width: 340px; margin: 0 0 18px; }
    .redes { display: flex; gap: 10px; }
    .redes a {
      display: inline-grid; place-items: center; width: 36px; height: 36px; border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.2); transition: background-color 0.2s ease, border-color 0.2s ease;
    }
    .redes a:hover, .redes a:focus-visible { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.5); }
    .base {
      margin-top: 36px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.14);
      color: var(--color-gris-verdoso); font-size: 0.85rem;
    }
    .base p { margin: 0 0 8px; }
    .fila-base { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px 24px; }
    @media (max-width: 900px) { .columnas { grid-template-columns: 1fr 1fr; } .col-marca { grid-column: 1 / -1; } }
    @media (max-width: 520px) { .columnas { grid-template-columns: 1fr; } }
  `,
})
export class Pie {
  private readonly auth = inject(AuthService);
  protected readonly correo = CORREO_CONTACTO;
  protected readonly telefono = TELEFONO_CONTACTO;
  protected readonly redes = REDES;

  /** Accesos según el rol de la sesión; sin sesión, solo el ingreso. */
  protected readonly categorias = computed(() => {
    switch (this.auth.rol()) {
      case 'PRODUCTOR':
        return [
          { ruta: '/predios', texto: 'Mis predios' },
          { ruta: '/mapa', texto: 'Mapa de riesgo' },
          { ruta: '/alertas', texto: 'Alertas' },
          { ruta: '/perfil', texto: 'Mi perfil' },
        ];
      case 'ASESOR':
        return [
          { ruta: '/dashboard', texto: 'Dashboard por zona' },
          { ruta: '/perfil', texto: 'Mi perfil' },
        ];
      case 'ADMIN':
        return [
          { ruta: '/dashboard', texto: 'Dashboard por zona' },
          { ruta: '/admin/usuarios', texto: 'Usuarios' },
          { ruta: '/admin/cultivos', texto: 'Catálogo de cultivos' },
          { ruta: '/admin/datos-economicos', texto: 'Datos económicos' },
        ];
      default:
        return [
          { ruta: '/acceso', texto: 'Iniciar sesión' },
          { ruta: '/recuperar', texto: 'Recuperar contraseña' },
        ];
    }
  });
}
