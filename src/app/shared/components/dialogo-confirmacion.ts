import {
  ChangeDetectionStrategy, Component, effect, ElementRef, inject, viewChild,
} from '@angular/core';
import { ConfirmacionService } from '../../core/services/confirmacion.service';
import { TPipe } from '../pipes/t.pipe';
import { Boton } from './boton';
import { Icono } from './icono';

/**
 * Diálogo de confirmación (T59) con el elemento <dialog> nativo: atrapa el foco, se cierra con Esc
 * y devuelve la respuesta al ConfirmacionService. Se coloca una sola vez en el layout.
 */
@Component({
  selector: 'app-dialogo-confirmacion',
  imports: [Boton, Icono, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialogo aria-labelledby="dialogo-titulo" aria-describedby="dialogo-mensaje" (cancel)="responder(false)">
      @if (servicio.pendiente(); as p) {
        <div class="encabezado">
          <span class="icono-circulo" [class.peligro]="p.peligro"><app-icono [nombre]="p.peligro ? 'alerta' : 'info'" /></span>
          <h2 id="dialogo-titulo">{{ p.titulo }}</h2>
        </div>
        <p id="dialogo-mensaje">{{ p.mensaje }}</p>
        <div class="fila fila-fin">
          <button appBoton variante="secundario" type="button" (click)="responder(false)">
            {{ p.textoCancelar ?? ('Cancelar' | t) }}
          </button>
          <button appBoton [variante]="p.peligro ? 'peligro' : 'primario'" type="button" (click)="responder(true)">
            {{ p.textoConfirmar ?? ('Confirmar' | t) }}
          </button>
        </div>
      }
    </dialog>
  `,
  styles: `
    dialog {
      width: min(460px, calc(100vw - 32px));
      border: 1px solid var(--color-borde);
      border-radius: 12px;
      padding: 24px;
      color: var(--color-texto);
      background: var(--color-superficie);
      box-shadow: var(--sombra-elevada);
    }
    dialog[open] { animation: emerger 0.22s var(--curva) both; }
    dialog::backdrop { background: rgba(15, 21, 17, 0.55); backdrop-filter: blur(2px); animation: aparecer 0.2s ease both; }
    .encabezado { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    h2 { font-size: 1.3rem; margin: 0; }
    .icono-circulo.peligro { background: var(--error-fondo); color: var(--error-texto); }
  `,
})
export class DialogoConfirmacion {
  protected readonly servicio = inject(ConfirmacionService);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    effect(() => {
      const elemento = this.dialogo().nativeElement;
      if (this.servicio.pendiente() && !elemento.open) {
        elemento.showModal();
      } else if (!this.servicio.pendiente() && elemento.open) {
        elemento.close();
      }
    });
  }

  protected responder(aceptado: boolean): void {
    this.servicio.pendiente()?.responder(aceptado);
  }
}
