import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icono, NombreIcono } from './icono';

/** Mensaje para listas sin datos, con un ícono y espacio para un botón de acción. */
@Component({
  selector: 'app-estado-vacio',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tarjeta' },
  template: `
    <span class="ilustracion"><app-icono [nombre]="icono()" [tamano]="36" /></span>
    <h3>{{ titulo() }}</h3>
    @if (mensaje()) {
      <p class="texto-suave">{{ mensaje() }}</p>
    }
    <ng-content />
  `,
  styles: `
    :host { display: block; text-align: center; padding: 40px 20px; }
    .ilustracion {
      display: inline-grid; place-items: center; width: 72px; height: 72px; margin-bottom: 12px;
      border-radius: 50%; background: var(--color-marca-claro); color: var(--color-acento);
      animation: latido 2.4s ease-in-out infinite;
    }
    p { max-width: 460px; margin-left: auto; margin-right: auto; }
  `,
})
export class EstadoVacio {
  readonly titulo = input.required<string>();
  readonly mensaje = input<string>();
  readonly icono = input<NombreIcono>('brote');
}
