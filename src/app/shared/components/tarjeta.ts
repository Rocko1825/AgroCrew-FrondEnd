import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Tarjeta reutilizable (T59): fondo blanco, borde de 1px #DDDDDD, radio de 8px y relleno de 20px,
 * con un título H3 opcional, igual que en la landing page.
 */
@Component({
  selector: 'app-tarjeta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tarjeta' },
  template: `
    @if (titulo()) {
      <h3 [class.mb-0]="subtitulo()">{{ titulo() }}</h3>
      @if (subtitulo()) {
        <p class="texto-suave subtitulo">{{ subtitulo() }}</p>
      }
    }
    <ng-content />
  `,
  styles: `
    :host { display: block; }
    .subtitulo { font-size: 0.875rem; margin-bottom: 12px; }
  `,
})
export class Tarjeta {
  readonly titulo = input<string>();
  readonly subtitulo = input<string>();
}
