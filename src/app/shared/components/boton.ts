import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { t } from '../../core/i18n/idioma';

/**
 * Botón reutilizable (T59) sobre un <button> nativo, con las variantes de la guía de estilo
 * y un estado de carga que lo deshabilita y avisa a los lectores de pantalla.
 *
 *   <button appBoton type="submit" [cargando]="guardando()">Guardar</button>
 *   <button appBoton variante="secundario" type="button">Cancelar</button>
 */
@Component({
  selector: 'button[appBoton]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'btn',
    '[class.btn-secundario]': 'variante() === "secundario"',
    '[class.btn-peligro]': 'variante() === "peligro"',
    '[class.btn-pequeno]': 'pequeno()',
    '[class.btn-bloque]': 'bloque()',
    '[attr.disabled]': 'cargando() || deshabilitado() ? true : null',
    '[attr.aria-busy]': 'cargando()',
  },
  template: `
    @if (cargando()) {
      <span class="giro" aria-hidden="true"></span>
      <span>{{ textoCargandoFinal() }}</span>
    } @else {
      <ng-content />
    }
  `,
  styles: `
    .giro {
      width: 1em; height: 1em; border-radius: 50%;
      border: 2px solid currentColor; border-right-color: transparent;
      animation: girar 0.7s linear infinite;
    }
    @keyframes girar { to { transform: rotate(360deg); } }
  `,
})
export class Boton {
  readonly variante = input<'primario' | 'secundario' | 'peligro'>('primario');
  readonly cargando = input(false);
  readonly deshabilitado = input(false);
  readonly pequeno = input(false);
  readonly bloque = input(false);
  readonly textoCargando = input<string>();
  protected readonly textoCargandoFinal = computed(() => this.textoCargando() ?? t('Procesando…'));
}
