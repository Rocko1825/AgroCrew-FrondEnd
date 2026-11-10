import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { Recomendacion } from '../../../core/models/api.models';
import { Icono } from '../../../shared/components/icono';
import { Medidor } from '../../../shared/components/medidor';
import { EtiquetaPipe } from '../../../shared/pipes/etiqueta.pipe';
import { TPipe } from '../../../shared/pipes/t.pipe';
import { DetalleFactores } from '../factores/detalle-factores';
import { TarjetaRentabilidad } from '../rentabilidad/tarjeta-rentabilidad';

/**
 * Ranking de cultivos (US18, T95): hasta 10 cultivos con puntaje de 0 a 100 y compatibilidad alta, media o baja.
 * Cada cultivo se despliega para ver sus factores (T97) y su rentabilidad referencial (T102).
 */
@Component({
  selector: 'app-ranking-cultivos',
  imports: [LowerCasePipe, EtiquetaPipe, Icono, Medidor, TPipe, DetalleFactores, TarjetaRentabilidad],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="ranking tarjeta">
      @for (r of ranking(); track r.cultivoId; let i = $index) {
        <li class="item" [class.abierto]="abierto(r.cultivoId)" [class.podio]="r.posicion === 1"
            [style.animation-delay.ms]="i * 50">
          <button class="resumen" type="button" [attr.aria-expanded]="abierto(r.cultivoId)"
                  [attr.aria-controls]="'factores-' + r.cultivoId" (click)="alternar(r.cultivoId)">
            <span class="posicion" aria-hidden="true">{{ r.posicion ?? '–' }}</span>
            <span class="nombre">
              <span class="cultivo">{{ r.cultivo }}</span>
              <small class="texto-suave">{{ r.tipo | etiqueta }}</small>
            </span>
            <app-medidor [valor]="r.puntaje" [compatibilidad]="r.compatibilidad" [tamano]="48" />
            <span [class]="'chip nivel-' + r.compatibilidad">{{ 'Compatibilidad' | t }} {{ r.compatibilidad | etiqueta | lowercase }}</span>
            <span class="ver">
              <span class="texto-ver">{{ (abierto(r.cultivoId) ? 'Ocultar factores' : 'Ver factores') | t }}</span>
              <app-icono nombre="abajo" [tamano]="18" class="flecha" />
            </span>
          </button>
          @if (abierto(r.cultivoId)) {
            <div class="detalle desplegable" [id]="'factores-' + r.cultivoId">
              <app-detalle-factores [factores]="r.factores" />
              @if (predioId()) {
                <app-tarjeta-rentabilidad [predioId]="predioId()!" [cultivoId]="r.cultivoId" />
              }
            </div>
          }
        </li>
      }
    </ol>
  `,
  styles: `
    .ranking { list-style: none; margin: 0; padding: 0; overflow: hidden; }
    .item { border-top: 1px solid var(--color-borde); animation: aparecer 0.4s var(--curva) both; }
    .item:first-child { border-top: none; }
    .item:hover .resumen, .item.abierto .resumen { background: var(--color-superficie-2); }
    .resumen {
      width: 100%; display: grid; grid-template-columns: auto minmax(120px, 1fr) auto auto auto; align-items: center; gap: 16px;
      padding: 12px 20px; background: none; border: none; transition: background-color 0.15s ease; font: inherit; color: inherit; text-align: left; cursor: pointer;
    }
    .posicion {
      display: inline-grid; place-items: center; width: 2.2rem; height: 2.2rem; border-radius: 50%;
      background: var(--color-pista); color: var(--color-texto); font-weight: 700;
    }
    .podio .posicion { background: #A88345; color: #FFFFFF; }
    .nombre { display: grid; }
    .cultivo { font-size: 1.05rem; font-weight: 700; }
    .ver { display: inline-flex; align-items: center; gap: 4px; color: var(--color-acento); font-weight: 600; }
    .flecha { transition: transform 0.25s var(--curva); }
    .abierto .flecha { transform: rotate(180deg); }
    .detalle { padding: 16px 20px 20px; background: var(--color-superficie-2); }
    @media (max-width: 768px) {
      .resumen { grid-template-columns: auto 1fr auto; gap: 10px 12px; }
      .resumen > .chip { grid-column: 2 / -1; justify-self: start; }
      .texto-ver { display: none; }
      .ver { grid-row: 1; grid-column: 3; }
      app-medidor { grid-row: 2; grid-column: 1; }
    }
  `,
})
export class RankingCultivos {
  readonly ranking = input.required<Recomendacion[]>();
  /** Si se indica, al desplegar un cultivo se muestra su rentabilidad en la región del predio. */
  readonly predioId = input<number | null>(null);

  private readonly abiertos = signal<ReadonlySet<number>>(new Set());

  protected abierto(cultivoId: number): boolean {
    return this.abiertos().has(cultivoId);
  }

  protected alternar(cultivoId: number): void {
    this.abiertos.update((s) => {
      const nuevo = new Set(s);
      if (nuevo.has(cultivoId)) {
        nuevo.delete(cultivoId);
      } else {
        nuevo.add(cultivoId);
      }
      return nuevo;
    });
  }
}
