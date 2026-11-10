import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { mensajeError } from '../../../core/interceptors/auth.interceptor';
import { Suelo } from '../../../core/models/api.models';
import { PredioService } from '../../../core/services/predio.service';
import { Aviso } from '../../../shared/components/aviso';
import { Cargando } from '../../../shared/components/cargando';
import { Icono } from '../../../shared/components/icono';
import { TApiPipe, TPipe } from '../../../shared/pipes/t.pipe';

/**
 * Suelo del predio (US11, T84) explicado sin códigos (US12, T85), con un botón para ver el detalle
 * técnico: código CUM original y fuente (MIDAGRI).
 */
@Component({
  selector: 'app-seccion-suelo',
  imports: [Aviso, Cargando, Icono, TPipe, TApiPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tarjeta' },
  template: `
    <div class="titulo-con-icono">
      <h3>{{ 'Suelo' | t }}</h3>
    </div>
    @if (error()) {
      <app-aviso tipo="advertencia">{{ error() }}</app-aviso>
    } @else if (!suelo()) {
      <app-cargando [texto]="'Consultando la clasificación de suelos…' | t" [lineas]="4" />
    } @else if (!suelo()!.disponible) {
      <app-aviso tipo="info" [titulo]="'Sin clasificación oficial' | t">{{ suelo()!.mensaje | tApi }}</app-aviso>
    } @else {
      @if (suelo(); as s) {
        <p class="grupo"><span class="chip"><span class="letra">{{ s.grupo?.codigo }}</span> {{ s.grupo?.nombre | tApi }}</span></p>
        <p>{{ s.grupo?.descripcionSimple | tApi }}</p>
        <p class="uso si"><app-icono nombre="check" [tamano]="16" /> <span><strong>{{ 'Te conviene:' | t }}</strong> {{ s.grupo?.usosRecomendados | tApi }}</span></p>
        <p class="uso no"><app-icono nombre="cerrar" [tamano]="16" /> <span><strong>{{ 'No es recomendable:' | t }}</strong> {{ s.grupo?.usosNoRecomendados | tApi }}</span></p>
        @if (s.calidadAgrologica) {
          <p><strong>{{ 'Calidad de la tierra:' | t }}</strong> {{ s.calidadAgrologica | tApi }}</p>
        }
        @if (s.limitaciones) {
          <p><strong>{{ 'Limitaciones:' | t }}</strong> {{ s.limitaciones | tApi }}</p>
        }
        <button class="btn-texto" type="button" aria-controls="detalle-tecnico-suelo"
                [attr.aria-expanded]="verDetalle()" (click)="verDetalle.set(!verDetalle())">
          {{ (verDetalle() ? 'Ocultar detalle técnico' : 'Ver detalle técnico') | t }}
          <app-icono nombre="abajo" [tamano]="16" class="flecha" [class.girada]="verDetalle()" />
        </button>
        @if (verDetalle()) {
          <dl id="detalle-tecnico-suelo" class="detalle desplegable">
            <dt>{{ 'Código CUM' | t }}</dt><dd>{{ s.codigoCumOriginal }}</dd>
            <dt>{{ 'Grupo' | t }}</dt><dd>{{ s.grupo?.codigo }} · {{ s.grupo?.nombre | tApi }}</dd>
            <dt>{{ 'Fuente' | t }}</dt><dd>{{ s.fuente | tApi }}</dd>
          </dl>
        }
      }
    }
  `,
  styles: `
    :host { display: block; }
    .grupo { margin-bottom: 8px; }
    .letra {
      display: inline-grid; place-items: center; width: 1.4rem; height: 1.4rem; border-radius: 50%;
      background: var(--color-marca); color: #FFFFFF; font-size: 0.75rem;
    }
    .uso { display: flex; gap: 8px; align-items: flex-start; }
    .uso app-icono { margin-top: 4px; }
    .uso.si app-icono { color: var(--medidor-alta); }
    .uso.no app-icono { color: var(--medidor-baja); }
    .flecha { transition: transform 0.25s var(--curva); }
    .flecha.girada { transform: rotate(180deg); }
    .detalle { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; margin: 8px 0 0; font-size: 0.9rem; }
    .detalle dt { color: var(--color-texto-suave); }
    .detalle dd { margin: 0; }
  `,
})
export class SeccionSuelo implements OnInit {
  private readonly predios = inject(PredioService);
  readonly predioId = input.required<number>();

  protected readonly suelo = signal<Suelo | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly verDetalle = signal(false);

  ngOnInit(): void {
    this.predios.suelo(this.predioId()).subscribe({
      next: (s) => this.suelo.set(s),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }
}
