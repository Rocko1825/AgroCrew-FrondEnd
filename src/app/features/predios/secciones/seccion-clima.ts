import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { LOCALE, t } from '../../../core/i18n/idioma';
import { estadoError, mensajeError } from '../../../core/interceptors/auth.interceptor';
import { Clima } from '../../../core/models/api.models';
import { PredioService } from '../../../core/services/predio.service';
import { Aviso } from '../../../shared/components/aviso';
import { Cargando } from '../../../shared/components/cargando';
import { Icono } from '../../../shared/components/icono';
import { Contador } from '../../../shared/components/contador';
import { Grafico, SerieGrafico } from '../../../shared/components/grafico';
import { TApiPipe, TPipe } from '../../../shared/pipes/t.pipe';

/**
 * Clima del predio (US13, T86): temperatura media y lluvia de los últimos 12 meses y un gráfico
 * con el pronóstico de 7 días. Si Open-Meteo no responde, se avisa.
 */
@Component({
  selector: 'app-seccion-clima',
  imports: [Aviso, Cargando, Icono, Contador, Grafico, TPipe, TApiPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tarjeta' },
  template: `
    <div class="titulo-con-icono">
      <h3>{{ 'Clima' | t }}</h3>
    </div>
    @if (error()) {
      <app-aviso tipo="advertencia">{{ error() }}</app-aviso>
    } @else if (!clima()) {
      <app-cargando [texto]="'Consultando el clima…' | t" [lineas]="4" />
    } @else {
      @if (clima(); as c) {
        <div class="resumen">
          <div class="dato">
            <span class="dato-etiqueta"><app-icono nombre="termometro" [tamano]="14" /> {{ 'Temperatura media' | t }}</span>
            @if (c.temperaturaMedia !== null) { <span class="dato-valor" [appContador]="c.temperaturaMedia" [decimales]="1" sufijo=" °C"></span> }
            @else { <span class="dato-valor">—</span> }
          </div>
          <div class="dato">
            <span class="dato-etiqueta"><app-icono nombre="gota" [tamano]="14" /> {{ 'Lluvia en 12 meses' | t }}</span>
            @if (c.precipitacionAnualMm !== null) { <span class="dato-valor" [appContador]="c.precipitacionAnualMm" sufijo=" mm"></span> }
            @else { <span class="dato-valor">—</span> }
          </div>
        </div>

        @if (c.pronostico.length) {
          <p class="subtitulo">{{ 'Pronóstico de 7 días' | t }}</p>
          @defer (on viewport) {
            <app-grafico tipo="combinado" [etiquetas]="dias()" [series]="seriesPronostico()" alto="190px"
                         [descripcion]="'Pronóstico de los próximos 7 días' | t" />
          } @placeholder {
            <div class="esqueleto" style="height: 190px; border-radius: var(--radio-tarjeta)"></div>
          }
        }
        @if (c.datosGuardados) {
          <app-aviso tipo="advertencia">{{ 'Open-Meteo no respondió: te mostramos los últimos datos guardados.' | t }}</app-aviso>
        }
        <p class="nota">{{ 'Fuente' | t }}: {{ c.fuente | tApi }}</p>
      }
    }
  `,
  styles: `
    :host { display: block; }
    .resumen { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .dato-etiqueta { display: inline-flex; align-items: center; gap: 4px; }
    .subtitulo { font-weight: 600; margin: 8px 0; }
    .nota { font-size: 0.8rem; color: var(--color-texto-suave); margin: 8px 0 0; }
  `,
})
export class SeccionClima implements OnInit {
  private readonly predios = inject(PredioService);
  readonly predioId = input.required<number>();

  protected readonly clima = signal<Clima | null>(null);
  protected readonly error = signal<string | null>(null);
  private readonly formatoDia = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
  protected readonly dias = computed(() =>
    (this.clima()?.pronostico ?? []).map((d) => this.formatoDia.format(new Date(d.fecha + 'T00:00:00Z'))));
  protected readonly seriesPronostico = computed<SerieGrafico[]>(() => {
    const p = this.clima()?.pronostico ?? [];
    return [
      { nombre: t('Lluvia (mm)'), datos: p.map((d) => d.precipitacionMm), color: '#3A6E96', eje: 'y', unidad: ' mm' },
      { nombre: t('Máxima (°C)'), datos: p.map((d) => d.temperaturaMax), color: '#D9661F', tipo: 'line', eje: 'y2', unidad: ' °C' },
      { nombre: t('Mínima (°C)'), datos: p.map((d) => d.temperaturaMin), color: '#4E8A5C', tipo: 'line', eje: 'y2', unidad: ' °C' },
    ];
  });

  ngOnInit(): void {
    this.predios.clima(this.predioId()).subscribe({
      next: (c) => this.clima.set(c),
      error: (e) => this.error.set(estadoError(e) === 503
        ? t('El servicio de clima no está disponible por ahora. Vuelve a intentarlo en unos minutos.')
        : mensajeError(e)),
    });
  }

}
