import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { t } from '../../core/i18n/idioma';

/**
 * Indicador de carga con "esqueleto" (barras grises con brillo) en lugar de un texto suelto.
 * El texto queda disponible para los lectores de pantalla.
 */
@Component({
  selector: 'app-cargando',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', 'aria-live': 'polite' },
  template: `
    <span class="sr-only">{{ textoFinal() }}</span>
    <div class="lineas" aria-hidden="true">
      @for (ancho of anchos(); track $index) { <span class="esqueleto" [style.width.%]="ancho"></span> }
    </div>
    @if (visible()) { <p class="texto-suave texto">{{ textoFinal() }}</p> }
  `,
  styles: `
    :host { display: block; padding: 8px 0; }
    .lineas { display: grid; gap: 10px; }
    .texto { margin: 10px 0 0; font-size: 0.875rem; }
  `,
})
export class Cargando {
  readonly texto = input<string>();
  readonly lineas = input(3);
  /** Muestra también el texto debajo del esqueleto (útil en cargas que tardan). */
  readonly visible = input(false);

  protected readonly textoFinal = computed(() => this.texto() ?? t('Cargando…'));
  protected readonly anchos = computed(() =>
    Array.from({ length: this.lineas() }, (_, i) => [92, 76, 58, 84, 66][i % 5]));
}
