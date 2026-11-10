import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, Subject, switchMap, catchError, of } from 'rxjs';
import { mensajeError } from '../../core/interceptors/auth.interceptor';
import { etiqueta } from '../../core/models/etiquetas';
import { NivelRiesgo, Predio, PuntoCritico } from '../../core/models/api.models';
import { PredioService } from '../../core/services/predio.service';
import { ReporteService } from '../../core/services/reporte.service';
import { Aviso } from '../../shared/components/aviso';
import { COLOR_NIVEL, Mapa, MarcadorMapa, VistaMapa } from '../../shared/components/mapa';
import { TPipe } from '../../shared/pipes/t.pipe';
import { t } from '../../core/i18n/idioma';

/**
 * Puntos críticos de la ANA en el mapa (US17, T93): color según el nivel de riesgo y detalle al pulsarlos.
 * La API busca alrededor de una coordenada, así que se consulta con el centro del mapa que se está viendo.
 */
@Component({
  selector: 'app-mapa-riesgo',
  imports: [Aviso, Mapa, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor pagina">
      <h1>{{ 'Mapa de riesgo hídrico' | t }}</h1>
      <p class="texto-suave">
        {{ 'Puntos críticos de inundación y desborde registrados por la ANA. Mueve o acerca el mapa para ver otra zona; pulsa un punto para ver su detalle.' | t }}
      </p>
      <ul class="leyenda tarjeta" [attr.aria-label]="'Leyenda de niveles de riesgo' | t">
        @for (n of niveles; track n) {
          <li><span class="punto" [style.background]="colores[n]" aria-hidden="true"></span>{{ etiqueta(n) }}</li>
        }
        <li><span class="punto predio" aria-hidden="true"></span>{{ 'Mis predios' | t }}</li>
      </ul>
      @defer (on viewport) {
        <app-mapa [marcadores]="marcadores()" [centro]="centro()" [zoom]="11" alto="480px"
                  (movido)="vista$.next($event)" [etiqueta]="'Mapa de puntos críticos de la ANA' | t" />
      } @placeholder {
        <div class="esqueleto" style="height: 480px; border-radius: var(--radio-tarjeta)"></div>
      }
      <p class="texto-suave estado" role="status">
        @if (buscando()) { {{ 'Buscando puntos críticos…' | t }} } @else { {{ '{n} puntos críticos en esta zona (radio de {km} km).' | t: { n: puntos().length, km: radio() } }} }
      </p>
      @if (error()) { <app-aviso tipo="advertencia">{{ error() }}</app-aviso> }
    </div>
  `,
  styles: `
    .leyenda { list-style: none; display: flex; flex-wrap: wrap; gap: 8px 20px; padding: 10px 16px; margin: 0 0 12px; }
    .leyenda li { display: inline-flex; align-items: center; gap: 6px; font-size: 0.9rem; }
    .punto { width: 14px; height: 14px; border-radius: 50%; border: 2px solid #FFFFFF; outline: 1px solid #7D877F; }
    .punto.predio { background: #2F5D3A; }
    .estado { margin-top: 8px; font-size: 0.9rem; }
  `,
})
export class MapaRiesgo implements OnInit {
  private readonly reportes = inject(ReporteService);
  private readonly predios = inject(PredioService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly niveles: NivelRiesgo[] = ['BAJO', 'MEDIO', 'ALTO', 'MUY_ALTO'];
  protected readonly colores = COLOR_NIVEL;
  protected readonly etiqueta = etiqueta;

  protected readonly vista$ = new Subject<VistaMapa>();
  protected readonly puntos = signal<PuntoCritico[]>([]);
  protected readonly misPredios = signal<Predio[]>([]);
  protected readonly centro = signal<[number, number] | null>(null);
  protected readonly radio = signal(0);
  protected readonly buscando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly marcadores = computed<MarcadorMapa[]>(() => [
    ...this.puntos().map((p) => ({
      latitud: p.latitud,
      longitud: p.longitud,
      color: COLOR_NIVEL[p.nivelRiesgo],
      titulo: `${p.tipoPeligro ?? t('Punto crítico')} · ${t('riesgo')} ${etiqueta(p.nivelRiesgo).toLowerCase()}`,
      popup: [
        p.descripcion,
        `${t('Riesgo')}: ${etiqueta(p.nivelRiesgo)}`,
        p.tipoPeligro ? `${t('Peligro')}: ${p.tipoPeligro}` : '',
        p.ubicacion ? `${t('Ubicación')}: ${p.ubicacion}` : '',
        `${t('Código ANA')}: ${p.codigoAna}`,
      ].filter(Boolean).join('\n'),
    })),
    ...this.misPredios().map((p) => ({
      latitud: p.latitud, longitud: p.longitud, color: '#2F5D3A', radio: 10, titulo: `${t('Mi predio')}: ${p.nombre}`,
    })),
  ]);

  ngOnInit(): void {
    this.predios.listar().subscribe({
      next: (l) => {
        this.misPredios.set(l);
        if (l.length) {
          this.centro.set([l[0].latitud, l[0].longitud]);
        }
      },
      error: () => this.misPredios.set([]),
    });

    this.vista$.pipe(
      debounceTime(400),
      switchMap((v) => {
        this.buscando.set(true);
        this.radio.set(Math.round(v.radioKm));
        return this.reportes.puntosCriticos(v.latitud, v.longitud, v.radioKm).pipe(
          catchError((e) => {
            this.error.set(mensajeError(e));
            return of([] as PuntoCritico[]);
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((l) => {
      this.buscando.set(false);
      this.puntos.set(l);
      if (l.length) {
        this.error.set(null);
      }
    });
  }
}
