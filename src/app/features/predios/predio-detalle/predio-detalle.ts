import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { mensajeError } from '../../../core/interceptors/auth.interceptor';
import { Evaluacion, Predio } from '../../../core/models/api.models';
import { PredioService } from '../../../core/services/predio.service';
import { Aviso } from '../../../shared/components/aviso';
import { Cargando } from '../../../shared/components/cargando';
import { Icono } from '../../../shared/components/icono';
import { EtiquetaPipe } from '../../../shared/pipes/etiqueta.pipe';
import { TPipe } from '../../../shared/pipes/t.pipe';
import { HistorialEvaluaciones } from '../../evaluaciones/historial/historial-evaluaciones';
import { PanelEvaluar } from '../../evaluaciones/panel-evaluar/panel-evaluar';
import { SeccionClima } from '../secciones/seccion-clima';
import { SeccionRiesgo } from '../secciones/seccion-riesgo';
import { SeccionSuelo } from '../secciones/seccion-suelo';

/**
 * Mi predio: flujo corto y guiado del productor (informe 3.3): ver suelo, clima y riesgo → evaluar →
 * leer el ranking. Cada sección carga por su cuenta, así un servicio caído no bloquea a los demás.
 */
@Component({
  selector: 'app-predio-detalle',
  imports: [RouterLink, DecimalPipe, Aviso, Cargando, Icono, EtiquetaPipe, TPipe,
    SeccionSuelo, SeccionClima, SeccionRiesgo, PanelEvaluar, HistorialEvaluaciones],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor pagina">
      @if (error()) {
        <app-aviso tipo="error">{{ error() }}</app-aviso>
        <p class="seccion-corta"><a routerLink="/predios">{{ 'Volver a mis predios' | t }}</a></p>
      } @else if (!predio()) {
        <app-cargando [lineas]="2" />
        <div class="grid-3 seccion-corta">
          <div class="tarjeta"><app-cargando [lineas]="5" /></div>
          <div class="tarjeta"><app-cargando [lineas]="5" /></div>
          <div class="tarjeta"><app-cargando [lineas]="5" /></div>
        </div>
      } @else {
        @if (predio(); as p) {
          <div class="pagina-encabezado cabecera-predio">
            <div>
              <a class="antetitulo volver" routerLink="/predios"><app-icono nombre="atras" [tamano]="14" /> {{ 'Mis predios' | t }}</a>
              <h1>{{ p.nombre }}</h1>
              <ul class="etiquetas">
                <li><app-icono nombre="ubicacion" [tamano]="14" /> {{ p.departamento }} / {{ p.provincia }} / {{ p.distrito }}</li>
                <li><app-icono nombre="capas" [tamano]="14" /> {{ p.areaHa | number: '1.0-2' }} ha</li>
                <li><app-icono nombre="gota" [tamano]="14" /> {{ p.fuenteAgua | etiqueta }}</li>
                @if (p.altitudMsnm) { <li><app-icono nombre="montana" [tamano]="14" /> {{ p.altitudMsnm }} {{ 'msnm' | t }}</li> }
              </ul>
            </div>
            <a class="btn btn-secundario" [routerLink]="['/predios', p.id, 'editar']"><app-icono nombre="lapiz" [tamano]="18" /> {{ 'Editar' | t }}</a>
          </div>

          <app-panel-evaluar [predioId]="id" (evaluado)="verResultado($event)" />

          <section class="seccion terreno" aria-labelledby="titulo-terreno">
            <h2 id="titulo-terreno">{{ 'Tu terreno' | t }}</h2>
            <p class="texto-suave">{{ 'Suelo, clima y riesgo de tu predio, según fuentes oficiales.' | t }}</p>
            <div class="grid-3">
              <app-seccion-suelo [predioId]="id" />
              <app-seccion-clima [predioId]="id" />
              <app-seccion-riesgo [predioId]="id" [predio]="p" />
            </div>
          </section>

          <app-historial-evaluaciones class="seccion" [predioId]="id" />
        }
      }
    </div>
  `,
  styles: `
    app-panel-evaluar, app-historial-evaluaciones { display: block; }
    .volver { text-decoration: none; }
    .etiquetas { list-style: none; display: flex; flex-wrap: wrap; gap: 4px 18px; margin: 8px 0 0; padding: 0; }
    .etiquetas li { display: inline-flex; align-items: center; gap: 6px; color: var(--color-texto-suave); }
    .cabecera-predio {
      padding: 22px 26px; margin-bottom: 32px; border-radius: var(--radio-tarjeta);
      background: var(--color-marca-claro); border-left: 5px solid var(--color-acento);
    }
    .terreno > h2 { margin-bottom: 4px; }
    .terreno > .texto-suave { margin-bottom: 20px; }
    .terreno .grid-3 { gap: 24px; align-items: start; }
    .terreno ::ng-deep .grid-3 > * { padding: 24px; line-height: 1.65; }
    .terreno ::ng-deep .grid-3 > * .titulo-con-icono {
      padding-bottom: 12px; margin-bottom: 16px; border-bottom: 1px solid var(--color-borde);
    }
    .terreno ::ng-deep .grid-3 > * p { margin-bottom: 0.9rem; }
    @media (max-width: 1100px) { .terreno .grid-3 { grid-template-columns: 1fr; } }
  `,
})
export class PredioDetalle implements OnInit {
  private readonly predios = inject(PredioService);
  private readonly router = inject(Router);

  /** Parámetro :id de la ruta. */
  readonly idRuta = input.required<string>({ alias: 'id' });
  private readonly idNumero = computed(() => Number(this.idRuta()));
  protected get id(): number {
    return this.idNumero();
  }

  protected readonly predio = signal<Predio | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.predios.obtener(this.id).subscribe({
      next: (p) => this.predio.set(p),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  protected verResultado(ev: Evaluacion): void {
    this.router.navigate(['/evaluaciones', ev.id]);
  }
}
