import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Factor, TipoFactor } from '../../../core/models/api.models';
import { Icono, NombreIcono } from '../../../shared/components/icono';
import { EtiquetaPipe } from '../../../shared/pipes/etiqueta.pipe';
import { TApiPipe, TPipe } from '../../../shared/pipes/t.pipe';

const ICONO_FACTOR: Record<TipoFactor, NombreIcono> = {
  SUELO: 'capas', ALTITUD: 'montana', TEMPERATURA: 'termometro', AGUA: 'gota', RIESGO_HIDRICO: 'escudo',
};

/**
 * Detalle de factores de un cultivo (US19, T97): aporte de suelo, altitud, temperatura, agua y riesgo hídrico
 * al puntaje, marcado como favorable, neutro o limitante.
 */
@Component({
  selector: 'app-detalle-factores',
  imports: [DecimalPipe, EtiquetaPipe, Icono, TPipe, TApiPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="factores">
      @for (f of factores(); track f.factor; let i = $index) {
        <li class="factor" [style.animation-delay.ms]="i * 60">
          <div class="encabezado">
            <span class="icono" [class]="'icono efecto-' + f.efecto"><app-icono [nombre]="icono(f.factor)" [tamano]="18" /></span>
            <strong>{{ f.factor | etiqueta }}</strong>
            <span [class]="'chip nivel-' + f.efecto">{{ f.efecto | etiqueta }}</span>
            <span class="aporte">{{ '{a} de {m} puntos' | t: { a: (f.aporte | number: '1.0-1'), m: f.aporteMaximo } }}</span>
          </div>
          <span class="barra-pista" aria-hidden="true">
            <span class="barra-relleno" [class]="'barra-relleno efecto-' + f.efecto"
                  [style.width.%]="f.aporteMaximo ? (f.aporte / f.aporteMaximo) * 100 : 0"></span>
          </span>
          <p class="valores">
            {{ 'Tu predio' | t }}: <strong>{{ (f.valorPredio | tApi) || ('sin dato' | t) }}</strong> ·
            {{ 'Lo que necesita' | t }}: <strong>{{ (f.valorRequerido | tApi) || '—' }}</strong>
          </p>
          @if (f.detalle) { <p class="texto-suave detalle">{{ f.detalle | tApi }}</p> }
        </li>
      }
    </ul>
  `,
  styles: `
    .factores { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; }
    .factor { animation: aparecer 0.35s var(--curva) both; }
    .encabezado { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 6px; }
    .icono { display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 8px; }
    .efecto-FAVORABLE.icono { background: var(--nivel-bajo-fondo); color: var(--nivel-bajo-texto); }
    .efecto-NEUTRO.icono { background: var(--nivel-medio-fondo); color: var(--nivel-medio-texto); }
    .efecto-LIMITANTE.icono { background: var(--nivel-muy-alto-fondo); color: var(--nivel-muy-alto-texto); }
    .barra-relleno.efecto-NEUTRO { background: #B98900; }
    .barra-relleno.efecto-LIMITANTE { background: #A1231A; }
    .aporte { margin-left: auto; font-size: 0.9rem; font-weight: 600; }
    .valores { margin: 6px 0 0; font-size: 0.9rem; }
    .detalle { margin: 2px 0 0; font-size: 0.875rem; }
  `,
})
export class DetalleFactores {
  readonly factores = input.required<Factor[]>();

  protected icono(factor: TipoFactor): NombreIcono {
    return ICONO_FACTOR[factor];
  }
}
