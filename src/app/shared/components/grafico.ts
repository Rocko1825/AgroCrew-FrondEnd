import {
  afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, input, viewChild,
} from '@angular/core';
import {
  ArcElement, BarController, BarElement, CategoryScale, Chart, ChartConfiguration, ChartDataset, DoughnutController,
  Filler, Legend, LinearScale, LineController, LineElement, PointElement, Tooltip,
} from 'chart.js';
import { LOCALE } from '../../core/i18n/idioma';
import { TemaService } from '../../core/services/tema.service';

// Solo se registran las piezas que usa la app (el paquete queda más liviano).
Chart.register(BarController, BarElement, LineController, LineElement, PointElement, DoughnutController, ArcElement,
  CategoryScale, LinearScale, Tooltip, Legend, Filler);

export interface SerieGrafico {
  nombre: string;
  datos: (number | null)[];
  /** Color sólido, o una lista de colores (uno por dato, para barras o donas). */
  color?: string | string[];
  /** En gráficos combinados: dibuja esta serie como línea. */
  tipo?: 'bar' | 'line';
  /** Eje en el que se dibuja (combinados con dos escalas). */
  eje?: 'y' | 'y2';
  unidad?: string;
}

/** Paleta de la marca para las series sin color propio. */
const PALETA = ['#5E8068', '#2F5D3A', '#8CB896', '#C9A66B', '#3A6E96', '#B98900', '#A1231A', '#6B7F70'];

/**
 * Gráfico reutilizable con Chart.js: barras (verticales u horizontales, apiladas), dona y combinado barra + línea.
 * Usa los colores y la fuente de la guía de estilo, cambia con el modo oscuro, respeta "reducir movimiento"
 * y deja una tabla oculta con los datos para lectores de pantalla.
 */
@Component({
  selector: 'app-grafico',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lienzo" [style.height]="alto()">
      <canvas #lienzo role="img" [attr.aria-label]="descripcion()"></canvas>
    </div>
    <table class="sr-only">
      <caption>{{ descripcion() }}</caption>
      <tr><th scope="col"></th>@for (s of series(); track s.nombre) { <th scope="col">{{ s.nombre }}</th> }</tr>
      @for (e of etiquetas(); track $index; let i = $index) {
        <tr><th scope="row">{{ e }}</th>@for (s of series(); track s.nombre) { <td>{{ s.datos[i] ?? '—' }}{{ s.unidad ?? '' }}</td> }</tr>
      }
    </table>
  `,
  styles: `
    :host { display: block; }
    .lienzo { position: relative; width: 100%; }
  `,
})
export class Grafico {
  readonly tipo = input<'bar' | 'doughnut' | 'combinado'>('bar');
  readonly etiquetas = input.required<string[]>();
  readonly series = input.required<SerieGrafico[]>();
  readonly horizontal = input(false);
  readonly apilado = input(false);
  readonly alto = input('260px');
  readonly descripcion = input('');
  /** Texto extra del tooltip para cada etiqueta (por ejemplo, el puntaje promedio). */
  readonly detalles = input<string[] | null>(null);
  readonly mostrarLeyenda = input<boolean | null>(null);

  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private readonly tema = inject(TemaService);
  private grafico?: Chart;
  private ultimaClave = '';

  private readonly formato = computed(() => new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }));

  constructor() {
    afterNextRender(() => this.dibujar());
    effect(() => {
      // Se vuelve a dibujar solo si cambian de verdad los datos o el tema (claro / oscuro).
      const clave = JSON.stringify([this.etiquetas(), this.series(), this.detalles(), this.tema.tema()]);
      if (this.grafico && clave !== this.ultimaClave) {
        this.dibujar();
      }
      this.ultimaClave = clave;
    });
    inject(DestroyRef).onDestroy(() => this.grafico?.destroy());
  }

  private dibujar(): void {
    this.grafico?.destroy();
    const css = getComputedStyle(document.documentElement);
    const color = (v: string) => css.getPropertyValue(v).trim();
    const texto = color('--color-texto-suave');
    const rejilla = color('--color-borde');
    const sinMovimiento = matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const tipo = this.tipo();
    const esDona = tipo === 'doughnut';

    const datasets = this.series().map((s, i) => {
      const base = PALETA[i % PALETA.length];
      const fondo = s.color ?? (esDona ? this.etiquetas().map((_, j) => PALETA[j % PALETA.length]) : base);
      const comoLinea = tipo === 'combinado' && s.tipo === 'line';
      return {
        type: comoLinea ? 'line' : esDona ? 'doughnut' : 'bar',
        label: s.nombre,
        data: s.datos,
        backgroundColor: fondo,
        borderColor: comoLinea ? fondo : esDona ? color('--color-superficie') : 'transparent',
        borderWidth: comoLinea ? 2.5 : esDona ? 3 : 0,
        borderRadius: esDona ? 0 : 6,
        maxBarThickness: 34,
        tension: 0.35,
        pointRadius: comoLinea ? 3 : 0,
        pointHoverRadius: 5,
        yAxisID: tipo === 'combinado' ? (s.eje ?? 'y') : undefined,
        order: comoLinea ? 0 : 1,
      } as ChartDataset;
    });

    const unidadDe = (i: number) => this.series()[i]?.unidad ?? '';
    const ejes = {
      x: {
        stacked: this.apilado(),
        grid: { display: this.horizontal(), color: rejilla },
        ticks: { color: texto, precision: 0 },
        border: { display: false },
        beginAtZero: true,
      },
      y: {
        stacked: this.apilado(),
        grid: { display: !this.horizontal(), color: rejilla },
        ticks: { color: texto, precision: 0 },
        border: { display: false },
        beginAtZero: true,
      },
      ...(tipo === 'combinado' ? {
        y2: { position: 'right' as const, grid: { display: false }, ticks: { color: texto }, border: { display: false } },
      } : {}),
    };

    const configuracion: ChartConfiguration = {
      type: esDona ? 'doughnut' : 'bar',
      data: { labels: this.etiquetas(), datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: this.horizontal() ? 'y' : 'x',
        locale: LOCALE,
        animation: sinMovimiento ? false : { duration: 900, easing: 'easeOutQuart' },
        // En barras horizontales cada categoría está en el eje Y: el tooltip debe buscar por ese eje.
        interaction: { mode: esDona ? 'nearest' : 'index', intersect: esDona, axis: this.horizontal() ? 'y' : 'x' },
        ...(esDona ? { cutout: '64%' } : { scales: ejes }),
        plugins: {
          legend: {
            display: this.mostrarLeyenda() ?? (esDona || this.series().length > 1),
            position: esDona ? 'right' : 'bottom',
            labels: { color: texto, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8, padding: 12, font: { size: 11 } },
          },
          tooltip: {
            backgroundColor: color('--color-superficie'),
            titleColor: color('--color-texto'),
            bodyColor: color('--color-texto'),
            borderColor: rejilla,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              label: (c) => {
                const valor = typeof c.raw === 'number' ? this.formato().format(c.raw) : '—';
                return ` ${c.dataset.label}: ${valor}${unidadDe(c.datasetIndex)}`;
              },
              afterLabel: (c) => this.detalles()?.[c.dataIndex] ?? '',
            },
          },
        },
      } as ChartConfiguration['options'],
    };

    Chart.defaults.font.family = color('--fuente') || 'Segoe UI, Roboto, Helvetica, Arial, sans-serif';
    this.grafico = new Chart(this.lienzo().nativeElement, configuracion);
  }
}
