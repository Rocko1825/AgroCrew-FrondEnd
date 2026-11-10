import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Compatibilidad } from '../../core/models/api.models';

/**
 * Medidor circular del puntaje de 0 a 100. El arco se dibuja al aparecer y toma el color
 * de la compatibilidad (alta, media o baja).
 */
@Component({
  selector: 'app-medidor',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', '[attr.aria-label]': 'valor() + " / 100"' },
  template: `
    <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 44 44" aria-hidden="true">
      <circle class="pista" cx="22" cy="22" r="18" />
      <circle class="arco" cx="22" cy="22" r="18" [style.stroke]="color()"
              [style.stroke-dashoffset]="desfase()" />
    </svg>
    <span class="numero" [style.font-size.px]="tamano() * 0.3">{{ valor() | number: '1.0-0' }}</span>
  `,
  styles: `
    :host { position: relative; display: inline-grid; place-items: center; flex: none; }
    svg { transform: rotate(-90deg); }
    circle { fill: none; stroke-width: 4.5; }
    .pista { stroke: var(--color-pista); }
    .arco {
      stroke-linecap: round; stroke-dasharray: 113.1;
      animation: dibujar 1s var(--curva) both;
    }
    .numero { position: absolute; font-weight: 700; line-height: 1; }
    @keyframes dibujar { from { stroke-dashoffset: 113.1; } }
  `,
})
export class Medidor {
  readonly valor = input.required<number>();
  readonly compatibilidad = input<Compatibilidad | null>(null);
  readonly tamano = input(52);

  protected readonly desfase = computed(() => 113.1 * (1 - Math.max(0, Math.min(100, this.valor())) / 100));
  protected readonly color = computed(() => {
    switch (this.compatibilidad()) {
      case 'ALTA': return 'var(--medidor-alta)';
      case 'MEDIA': return 'var(--medidor-media)';
      case 'BAJA': return 'var(--medidor-baja)';
      default: return 'var(--color-acento)';
    }
  });
}
