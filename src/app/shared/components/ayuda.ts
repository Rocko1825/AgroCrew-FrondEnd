import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { TPipe } from '../pipes/t.pipe';
import { Icono } from './icono';

let siguienteId = 0;

/**
 * Ícono de ayuda con un tooltip explicativo (sin librerías). Se muestra al pasar el cursor, al enfocarlo
 * con el teclado o al tocarlo en el celular; Esc lo cierra. El texto queda asociado con aria-describedby.
 *   <app-ayuda [texto]="'Explicación del indicador' | t" />
 */
@Component({
  selector: 'app-ayuda',
  imports: [Icono, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.abierta]': 'abierta()', '(mouseenter)': 'abierta.set(true)', '(mouseleave)': 'abierta.set(false)' },
  template: `
    <button type="button" class="boton" [attr.aria-label]="'Más información' | t" [attr.aria-describedby]="id"
            [attr.aria-expanded]="abierta()" (click)="abierta.set(!abierta())" (focus)="abierta.set(true)"
            (blur)="abierta.set(false)" (keydown.escape)="abierta.set(false)">
      <app-icono nombre="info" [tamano]="14" />
    </button>
    <span class="burbuja" role="tooltip" [id]="id">{{ texto() }}</span>
  `,
  styles: `
    :host { position: relative; display: inline-flex; vertical-align: middle; }
    .boton {
      display: inline-grid; place-items: center; width: 20px; height: 20px; padding: 0;
      border: none; border-radius: 50%; background: none; color: var(--color-texto-suave); cursor: help;
      transition: color 0.15s ease, background-color 0.15s ease;
    }
    .boton:hover, :host.abierta .boton { color: var(--color-acento); background: var(--color-marca-claro); }
    .burbuja {
      position: absolute; bottom: calc(100% + 8px); left: 50%; z-index: 50;
      width: max-content; max-width: 240px; padding: 8px 10px; border-radius: 8px;
      background: var(--color-texto); color: var(--color-superficie);
      font-size: 0.8rem; font-weight: 500; line-height: 1.4; text-align: left;
      box-shadow: var(--sombra-elevada); pointer-events: none;
      opacity: 0; visibility: hidden; transform: translate(-50%, 4px);
      transition: opacity 0.15s ease, transform 0.2s var(--curva), visibility 0.15s;
    }
    .burbuja::after {
      content: ''; position: absolute; top: 100%; left: 50%; margin-left: -5px;
      border: 5px solid transparent; border-top-color: var(--color-texto);
    }
    :host.abierta .burbuja { opacity: 1; visibility: visible; transform: translate(-50%, 0); }
  `,
})
export class Ayuda {
  readonly texto = input.required<string>();
  protected readonly id = `ayuda-${++siguienteId}`;
  protected readonly abierta = signal(false);
}
