import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icono, NombreIcono } from './icono';

/**
 * Aviso reutilizable (T59): mensajes de información, éxito, advertencia o error, con su ícono.
 * Los errores usan role="alert" para que los lectores de pantalla los anuncien de inmediato.
 *
 *   <app-aviso tipo="advertencia" titulo="Resultado parcial">Texto</app-aviso>
 */
@Component({
  selector: 'app-aviso',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"aviso aviso-" + tipo()',
    '[attr.role]': 'rol()',
  },
  template: `
    <app-icono class="icono" [nombre]="icono()" />
    <div class="contenido">
      @if (titulo()) {
        <p class="aviso-titulo">{{ titulo() }}</p>
      }
      <div class="aviso-cuerpo"><ng-content /></div>
    </div>
  `,
  styles: `
    :host {
      display: flex; gap: 12px; align-items: flex-start;
      padding: 14px 18px; border-radius: var(--radio-tarjeta); border: 1px solid transparent;
      animation: aparecer 0.3s var(--curva) both;
    }
    :host.aviso-info { background: var(--info-fondo); color: var(--info-texto); border-color: var(--info-borde); }
    :host.aviso-exito { background: var(--exito-fondo); color: var(--exito-texto); border-color: var(--exito-borde); }
    :host.aviso-advertencia { background: var(--aviso-fondo); color: var(--aviso-texto); border-color: var(--aviso-borde); }
    :host.aviso-error { background: var(--error-fondo); color: var(--error-texto); border-color: var(--error-borde); }
    .icono { margin-top: 2px; }
    .contenido { flex: 1; min-width: 0; }
    .aviso-titulo { font-weight: 700; margin: 0 0 4px; }
    .aviso-cuerpo :last-child { margin-bottom: 0; }
  `,
})
export class Aviso {
  readonly tipo = input<'info' | 'exito' | 'advertencia' | 'error'>('info');
  readonly titulo = input<string>();
  protected readonly rol = computed(() => (this.tipo() === 'error' ? 'alert' : 'status'));
  protected readonly icono = computed<NombreIcono>(() => {
    switch (this.tipo()) {
      case 'exito': return 'check';
      case 'advertencia':
      case 'error': return 'alerta';
      default: return 'info';
    }
  });
}
