import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { DecimalPipe, LowerCasePipe } from '@angular/common';
import { t } from '../../../core/i18n/idioma';
import { etiqueta } from '../../../core/models/etiquetas';
import { mensajeError } from '../../../core/interceptors/auth.interceptor';
import { Predio, Riesgo } from '../../../core/models/api.models';
import { PredioService } from '../../../core/services/predio.service';
import { Aviso } from '../../../shared/components/aviso';
import { Cargando } from '../../../shared/components/cargando';
import { COLOR_NIVEL, Mapa, MarcadorMapa } from '../../../shared/components/mapa';
import { EtiquetaPipe } from '../../../shared/pipes/etiqueta.pipe';
import { TApiPipe, TPipe } from '../../../shared/pipes/t.pipe';

/**
 * Riesgo hídrico del predio (US14, T87): nivel de bajo a muy alto, tipo de peligro y distancia
 * del punto crítico de la ANA más cercano, con un mapa pequeño.
 */
@Component({
  selector: 'app-seccion-riesgo',
  imports: [Aviso, Cargando, DecimalPipe, LowerCasePipe, EtiquetaPipe, Mapa, TPipe, TApiPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tarjeta' },
  template: `
    <div class="titulo-con-icono">
      <h3>{{ 'Riesgo hídrico' | t }}</h3>
    </div>
    @if (error()) {
      <app-aviso tipo="advertencia">{{ error() }}</app-aviso>
    } @else if (!riesgo()) {
      <app-cargando [texto]="'Consultando los puntos críticos de la ANA…' | t" [lineas]="4" />
    } @else {
      @if (riesgo(); as r) {
        <div class="nivel-riesgo">
          <span [class]="'chip nivel nivel-' + r.nivelRiesgo">{{ 'Riesgo' | t }} {{ r.nivelRiesgo | etiqueta | lowercase }}</span>
          <div class="escala" aria-hidden="true">
            @for (n of niveles; track n) { <span [class.activo]="n === r.nivelRiesgo" [style.background]="colores[n]"></span> }
          </div>
        </div>
        <p>{{ r.mensaje | tApi }}</p>
        @if (r.puntoMasCercano; as p) {
          <dl class="detalle">
            <dt>{{ 'Punto más cercano' | t }}</dt><dd>{{ p.distanciaKm | number: '1.1-1' }} km</dd>
            <dt>{{ 'Tipo de peligro' | t }}</dt><dd>{{ p.tipoPeligro || ('No especificado' | t) }}</dd>
            <dt>{{ 'Descripción' | t }}</dt><dd>{{ p.descripcion }}</dd>
          </dl>
        } @else {
          <app-aviso tipo="exito">{{ 'No hay puntos críticos de la ANA a menos de {km} km de tu predio.' | t: { km: r.radioKm } }}</app-aviso>
        }
        @if (predio()) {
          @defer (on viewport) {
            <app-mapa class="mapa-riesgo" [marcadores]="marcadores()" [ajustar]="true" alto="220px"
                      [etiqueta]="'Mapa del predio y los puntos críticos cercanos' | t" />
          } @placeholder {
            <div class="esqueleto" style="height: 220px; border-radius: var(--radio-tarjeta)"></div>
          }
        }
      }
    }
  `,
  styles: `
    :host { display: block; }
    .nivel-riesgo { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
    .nivel { font-size: 1rem; padding: 4px 14px; }
    .escala { display: flex; gap: 4px; }
    .escala span { width: 22px; height: 8px; border-radius: 4px; opacity: 0.25; transition: opacity 0.3s ease, transform 0.3s var(--curva); }
    .escala span.activo { opacity: 1; transform: scaleY(1.5); }
    .detalle { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; margin: 0 0 12px; font-size: 0.9rem; }
    .detalle dt { color: var(--color-texto-suave); }
    .detalle dd { margin: 0; }
    .mapa-riesgo { display: block; margin-top: 12px; }
  `,
})
export class SeccionRiesgo implements OnInit {
  private readonly predios = inject(PredioService);
  readonly predioId = input.required<number>();
  readonly predio = input<Predio | null>(null);

  protected readonly niveles = ['BAJO', 'MEDIO', 'ALTO', 'MUY_ALTO'] as const;
  protected readonly colores = COLOR_NIVEL;
  protected readonly riesgo = signal<Riesgo | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly marcadores = computed<MarcadorMapa[]>(() => {
    const p = this.predio();
    const r = this.riesgo();
    const lista: MarcadorMapa[] = (r?.puntosCercanos ?? []).map((pc) => ({
      latitud: pc.latitud,
      longitud: pc.longitud,
      color: COLOR_NIVEL[pc.nivelRiesgo],
      radio: 7,
      titulo: `${pc.tipoPeligro ?? t('Punto crítico')} · ${t('riesgo')} ${etiqueta(pc.nivelRiesgo).toLowerCase()}`,
      popup: `${pc.descripcion}\n${t('Distancia')}: ${pc.distanciaKm?.toFixed(1) ?? '—'} km`,
    }));
    if (p) {
      lista.push({ latitud: p.latitud, longitud: p.longitud, color: '#2F5D3A', radio: 10, titulo: p.nombre });
    }
    return lista;
  });

  ngOnInit(): void {
    this.predios.riesgo(this.predioId()).subscribe({
      next: (r) => this.riesgo.set(r),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }
}
