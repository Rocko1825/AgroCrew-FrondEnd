import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Trazos de los íconos (24×24, línea de 2 px). Dibujados para AgroCrew, sin librerías externas. */
const ICONOS = {
  hoja: ['M5 19c0-8 6-14 14-14 0 8-6 14-14 14z', 'M5 19l8-8'],
  brote: ['M12 21v-8', 'M12 13c0-4-3-6-7-6 0 4 3 6 7 6z', 'M12 11c0-4 3-6 7-6 0 4-3 6-7 6z'],
  mapa: ['M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z', 'M9 4v14', 'M15 6v14'],
  ubicacion: ['M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z', 'M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  campana: ['M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z', 'M10 21a2 2 0 0 0 4 0'],
  grafico: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M3 20h18'],
  usuario: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21a8 8 0 0 1 16 0'],
  usuarios: ['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M2 21a7 7 0 0 1 14 0', 'M16 3.5a4 4 0 0 1 0 7', 'M18 14a7 7 0 0 1 4 7'],
  sol: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'],
  luna: ['M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'],
  globo: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M3 12h18', 'M12 3c3 3 3 15 0 18c-3-3-3-15 0-18'],
  gota: ['M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z'],
  termometro: ['M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z'],
  lluvia: ['M7 15a4 4 0 1 1 .9-7.9A5 5 0 0 1 17.5 8 3.5 3.5 0 0 1 17 15z', 'M8 18v3M12 18v3M16 18v3'],
  montana: ['M3 20l6-10 4 6 3-4 5 8z'],
  escudo: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'],
  capas: ['M3 8l9-4 9 4-9 4z', 'M3 12l9 4 9-4', 'M3 16l9 4 9-4'],
  descarga: ['M12 4v12', 'M7 11l5 5 5-5', 'M4 20h16'],
  mas: ['M12 5v14M5 12h14'],
  lapiz: ['M4 20h4L19 9l-4-4L4 16z'],
  basura: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13'],
  check: ['M5 12l5 5L20 7'],
  atras: ['M15 6l-6 6 6 6'],
  abajo: ['M6 9l6 6 6-6'],
  moneda: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
    'M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5', 'M12 6v2M12 16v2'],
  calendario: ['M4 6h16v14H4z', 'M4 10h16', 'M8 3v4M16 3v4'],
  info: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 11v5', 'M12 8h.01'],
  alerta: ['M12 3l10 18H2z', 'M12 10v4', 'M12 17.5h.01'],
  cerrar: ['M6 6l12 12M18 6L6 18'],
  salir: ['M15 4h4v16h-4', 'M10 8l-4 4 4 4', 'M6 12h10'],
  chispa: ['M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z'],
  busqueda: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M20 20l-4-4'],
  menu: ['M4 7h16M4 12h16M4 17h16'],
  reloj: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7v5l3 2'],
} as const;

export type NombreIcono = keyof typeof ICONOS;

/**
 * Ícono decorativo: <app-icono nombre="hoja" />. Toma el color del texto (currentColor).
 * Es aria-hidden: el texto que lo acompaña es el que se lee.
 */
@Component({
  selector: 'app-icono',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[style.width.px]': 'tamano()', '[style.height.px]': 'tamano()' },
  template: `
    <svg viewBox="0 0 24 24" [attr.width]="tamano()" [attr.height]="tamano()" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false">
      @for (d of trazos(); track $index) { <path [attr.d]="d" /> }
    </svg>
  `,
  styles: `:host { display: inline-flex; flex: none; } svg { display: block; }`,
})
export class Icono {
  readonly nombre = input.required<NombreIcono>();
  readonly tamano = input(20);
  protected readonly trazos = computed(() => ICONOS[this.nombre()]);
}
