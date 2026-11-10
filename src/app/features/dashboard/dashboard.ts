import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, debounceTime, of, Subject, switchMap } from 'rxjs';
import { mensajeError } from '../../core/interceptors/auth.interceptor';
import { t } from '../../core/i18n/idioma';
import { etiqueta, MESES } from '../../core/models/etiquetas';
import {
  Indicadores, NivelRiesgo, PuntoCritico, ReporteConteo, ReporteCultivo, ReporteMensual, ReporteNivelRiesgo, Ubigeo,
} from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { ReporteService } from '../../core/services/reporte.service';
import { UbigeoService } from '../../core/services/ubigeo.service';
import { Aviso } from '../../shared/components/aviso';
import { Ayuda } from '../../shared/components/ayuda';
import { Contador } from '../../shared/components/contador';
import { Grafico, SerieGrafico } from '../../shared/components/grafico';
import { COLOR_NIVEL } from '../../shared/components/mapa';

interface BarraDato {
  etiqueta: string;
  valor: number;
  detalle?: string;
}
import { Mapa, VistaMapa } from '../../shared/components/mapa';
import { descargarCsv } from '../../shared/utils/csv';
import { Icono } from '../../shared/components/icono';
import { TPipe } from '../../shared/pipes/t.pipe';
import { CENTRO_DEPARTAMENTO } from './centros-departamento';

const INTENSIDAD_NIVEL: Record<NivelRiesgo, number> = { BAJO: 0.3, MEDIO: 0.5, ALTO: 0.8, MUY_ALTO: 1 };
const NIVELES: NivelRiesgo[] = ['BAJO', 'MEDIO', 'ALTO', 'MUY_ALTO'];

/**
 * Dashboard por zona (mockup de la figura 14) para asesores y gobiernos locales:
 * aptitud por zona (US26), riesgo hídrico por zona con mapa de calor (US27), filtros (US28),
 * exportación a CSV (US29) y métricas de validación para el administrador (US34).
 */
@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, DecimalPipe, Aviso, Ayuda, Grafico, Contador, Mapa, Icono, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly reportes = inject(ReporteService);
  private readonly ubigeo = inject(UbigeoService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);

  protected readonly niveles = NIVELES;
  protected readonly etiqueta = etiqueta;
  protected readonly departamentos = signal<Ubigeo[]>([]);

  // ---------- Filtros (US28, T108) ----------
  protected readonly departamentoId = signal<number | null>(null);
  protected readonly desde = signal('');
  protected readonly hasta = signal('');
  protected readonly errorFiltro = signal<string | null>(null);
  /** Filtros aplicados al pulsar "Filtrar". */
  protected readonly aplicado = signal<{ departamentoId: number | null; desde: string; hasta: string }>(
    { departamentoId: null, desde: '', hasta: '' });
  protected readonly departamentoAplicado = computed(() =>
    this.departamentos().find((d) => d.id === this.aplicado().departamentoId)?.nombre ?? null);

  // ---------- Datos ----------
  protected readonly indicadores = signal<Indicadores | null>(null);
  protected readonly prediosPorDepartamento = signal<ReporteConteo[]>([]);
  protected readonly gruposCum = signal<ReporteConteo[] | null>(null);
  protected readonly cultivos = signal<ReporteCultivo[] | null>(null);
  protected readonly puntosPorDepartamento = signal<ReporteNivelRiesgo[]>([]);
  protected readonly prediosPorNivel = signal<ReporteNivelRiesgo[]>([]);
  protected readonly anio = signal(new Date().getFullYear());
  protected readonly alertasMes = signal<ReporteMensual[]>([]);
  protected readonly error = signal<string | null>(null);

  // ---------- Mapa de calor (T107) ----------
  protected readonly vista$ = new Subject<VistaMapa>();
  protected readonly puntosMapa = signal<PuntoCritico[]>([]);
  protected readonly centroMapa = signal<[number, number] | null>(null);
  protected readonly calor = computed<[number, number, number][]>(() =>
    this.puntosMapa().map((p) => [p.latitud, p.longitud, INTENSIDAD_NIVEL[p.nivelRiesgo]]));

  // ---------- Gráficos ----------
  protected readonly barrasPredios = computed<BarraDato[]>(() => this.filtrarZona(this.prediosPorDepartamento())
    .map((r) => ({ etiqueta: r.etiqueta, valor: r.cantidad })));

  protected readonly barrasGrupos = computed<BarraDato[]>(() => (this.gruposCum() ?? [])
    .map((r) => ({ etiqueta: r.etiqueta === 'SIN CLASIFICACION' ? t('Sin clasificación') : `${t('Grupo')} ${r.etiqueta}`, valor: r.cantidad })));

  protected readonly barrasCultivos = computed<BarraDato[]>(() => (this.cultivos() ?? []).map((c) => ({
    etiqueta: c.cultivo,
    valor: c.vecesRecomendado,
    detalle: c.puntajePromedio !== null ? `${t('puntaje')} ${c.puntajePromedio}` : undefined,
  })));

  /** Puntos críticos por nivel en la zona elegida (o en todo el país). */
  protected readonly barrasPuntosNivel = computed<BarraDato[]>(() => {
    const filas = this.filtrarZonaRiesgo(this.puntosPorDepartamento());
    return NIVELES.map((n) => ({
      etiqueta: etiqueta(n),
      valor: filas.filter((f) => f.nivelRiesgo === n).reduce((s, f) => s + f.cantidad, 0),
    }));
  });

  /** % de predios evaluados con riesgo alto o muy alto en la zona (US27). */
  protected readonly exposicion = computed(() => {
    const filas = this.filtrarZonaRiesgo(this.prediosPorNivel());
    const total = filas.reduce((s, f) => s + f.cantidad, 0);
    const expuestos = filas.filter((f) => f.nivelRiesgo === 'ALTO' || f.nivelRiesgo === 'MUY_ALTO')
      .reduce((s, f) => s + f.cantidad, 0);
    return { total, expuestos, porcentaje: total ? Math.round((expuestos * 1000) / total) / 10 : 0 };
  });

  protected readonly barrasAlertas = computed<BarraDato[]>(() => MESES.map((mes, i) => {
    const delMes = this.alertasMes().filter((a) => a.mes === i + 1);
    const riesgo = delMes.filter((a) => a.tipo === 'RIESGO_HIDRICO').reduce((s, a) => s + a.cantidad, 0);
    const lluvia = delMes.filter((a) => a.tipo === 'LLUVIA_INTENSA').reduce((s, a) => s + a.cantidad, 0);
    return { etiqueta: mes, valor: riesgo + lluvia, detalle: `${t('riesgo')} ${riesgo} · ${t('lluvia')} ${lluvia}` };
  }));

  // ---------- Datos para Chart.js ----------
  protected readonly etiquetasDe = (b: BarraDato[]) => b.map((x) => x.etiqueta);
  protected readonly serie = (nombre: string, b: BarraDato[], color?: string | string[], unidad = ''): SerieGrafico[] =>
    [{ nombre, datos: b.map((x) => x.valor), color, unidad }];
  protected readonly detallesDe = (b: BarraDato[]) => b.map((x) => x.detalle ?? '');
  protected readonly coloresNivel = NIVELES.map((n) => COLOR_NIVEL[n]);
  protected readonly seriesAlertas = computed<SerieGrafico[]>(() => [
    { nombre: t('Riesgo hídrico'), color: '#D9661F',
      datos: MESES.map((_, i) => this.alertasMes().filter((a) => a.mes === i + 1 && a.tipo === 'RIESGO_HIDRICO').reduce((s, a) => s + a.cantidad, 0)) },
    { nombre: t('Lluvia intensa'), color: '#3A6E96',
      datos: MESES.map((_, i) => this.alertasMes().filter((a) => a.mes === i + 1 && a.tipo === 'LLUVIA_INTENSA').reduce((s, a) => s + a.cantidad, 0)) },
  ]);
  protected readonly meses = MESES;
  protected readonly altoHorizontal = (n: number) => `${Math.max(160, n * 34 + 40)}px`;

  protected readonly anios = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

  ngOnInit(): void {
    this.ubigeo.departamentos().subscribe((d) => this.departamentos.set(d));
    const fallo = (e: unknown) => this.error.set(mensajeError(e));
    this.reportes.indicadores().subscribe({ next: (r) => this.indicadores.set(r), error: fallo });
    this.reportes.prediosPorDepartamento().subscribe({ next: (r) => this.prediosPorDepartamento.set(r), error: fallo });
    this.reportes.puntosCriticosPorDepartamento().subscribe({ next: (r) => this.puntosPorDepartamento.set(r), error: fallo });
    this.reportes.prediosPorNivelRiesgo().subscribe({ next: (r) => this.prediosPorNivel.set(r), error: fallo });
    this.cargarAlertas(this.anio());
    this.cargarZona();

    this.vista$.pipe(
      debounceTime(400),
      switchMap((v) => this.reportes.puntosCriticos(v.latitud, v.longitud, v.radioKm)
        .pipe(catchError(() => of([] as PuntoCritico[])))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((l) => this.puntosMapa.set(l));
  }

  /** T108: valida las fechas y aplica los filtros. */
  protected filtrar(): void {
    if (this.desde() && this.hasta() && this.desde() > this.hasta()) {
      this.errorFiltro.set(t('La fecha «desde» no puede ser posterior a la fecha «hasta».'));
      return;
    }
    this.errorFiltro.set(null);
    this.aplicado.set({ departamentoId: this.departamentoId(), desde: this.desde(), hasta: this.hasta() });
    this.cargarZona();
    const nombre = this.departamentoAplicado();
    this.centroMapa.set(nombre ? CENTRO_DEPARTAMENTO[nombre] ?? null : null);
  }

  protected limpiar(): void {
    this.departamentoId.set(null);
    this.desde.set('');
    this.hasta.set('');
    this.filtrar();
  }

  protected cargarAlertas(anio: number): void {
    this.anio.set(anio);
    this.reportes.alertasPorMes(anio).subscribe({ next: (r) => this.alertasMes.set(r), error: () => this.alertasMes.set([]) });
  }

  /** T109: exporta los indicadores con los filtros aplicados. */
  protected exportarCsv(): void {
    const f = this.aplicado();
    const ind = this.indicadores();
    const filas: (string | number | null)[][] = [
      [t('AgroCrew - Reporte por zona')],
      [t('Generado'), new Date().toLocaleString()],
      [t('Departamento'), this.departamentoAplicado() ?? t('Todos')],
      [t('Desde'), f.desde || t('Últimos 12 meses')],
      [t('Hasta'), f.hasta || t('Hoy')],
      [],
      [t('Sección'), t('Indicador'), t('Valor'), t('Detalle')],
    ];
    if (ind) {
      filas.push(
        [t('Indicadores generales'), t('Predios activos'), ind.prediosActivos, null],
        [t('Indicadores generales'), t('Evaluaciones'), ind.evaluaciones, null],
        [t('Indicadores generales'), t('% evaluaciones completadas'), ind.porcentajeEvaluacionesCompletadas, null],
        [t('Indicadores generales'), t('% evaluaciones preventivas'), ind.porcentajeEvaluacionesPreventivas, null],
        [t('Indicadores generales'), t('% calificaciones de 4 o 5'), ind.porcentajeCalificacionesUtiles, t('{n} calificaciones', { n: ind.calificaciones })],
        [t('Indicadores generales'), t('Puntos críticos'), ind.puntosCriticos, null],
      );
    }
    this.barrasPredios().forEach((b) => filas.push([t('Predios por departamento'), b.etiqueta, b.valor, null]));
    this.barrasGrupos().forEach((b) => filas.push([t('Evaluaciones por grupo de suelo'), b.etiqueta, b.valor, null]));
    this.barrasCultivos().forEach((b) => filas.push([t('Cultivos más recomendados'), b.etiqueta, b.valor, b.detalle ?? null]));
    this.barrasPuntosNivel().forEach((b) => filas.push([t('Puntos críticos por nivel'), b.etiqueta, b.valor, null]));
    const ex = this.exposicion();
    filas.push([t('Riesgo hídrico'), t('% predios con riesgo alto o muy alto'), ex.porcentaje, t('{a} de {b}', { a: ex.expuestos, b: ex.total })]);
    this.barrasAlertas().forEach((b) => filas.push([t('Alertas {anio}', { anio: this.anio() }), b.etiqueta, b.valor, b.detalle ?? null]));

    const zona = (this.departamentoAplicado() ?? 'peru').toLowerCase().replace(/\s+/g, '-');
    descargarCsv(`agrocrew-reporte-${zona}-${new Date().toISOString().slice(0, 10)}.csv`, filas);
  }

  private cargarZona(): void {
    const f = this.aplicado();
    this.gruposCum.set(null);
    this.cultivos.set(null);
    this.reportes.evaluacionesPorGrupoCum(f.departamentoId).subscribe({
      next: (r) => this.gruposCum.set(r), error: () => this.gruposCum.set([]),
    });
    this.reportes.cultivosMasRecomendados(f.departamentoId, f.desde || null, f.hasta || null).subscribe({
      next: (r) => this.cultivos.set(r), error: () => this.cultivos.set([]),
    });
  }

  private filtrarZona(filas: ReporteConteo[]): ReporteConteo[] {
    const nombre = this.departamentoAplicado();
    return nombre ? filas.filter((f) => f.etiqueta === nombre) : filas;
  }

  private filtrarZonaRiesgo(filas: ReporteNivelRiesgo[]): ReporteNivelRiesgo[] {
    const nombre = this.departamentoAplicado();
    return nombre ? filas.filter((f) => f.departamento === nombre) : filas;
  }
}
