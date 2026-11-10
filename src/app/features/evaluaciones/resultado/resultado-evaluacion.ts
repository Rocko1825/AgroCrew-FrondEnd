import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe, LowerCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IDIOMA, t, tApi } from '../../../core/i18n/idioma';
import { mensajeError } from '../../../core/interceptors/auth.interceptor';
import { etiqueta } from '../../../core/models/etiquetas';
import { Evaluacion } from '../../../core/models/api.models';
import { EvaluacionService } from '../../../core/services/evaluacion.service';
import { Aviso } from '../../../shared/components/aviso';
import { Cargando } from '../../../shared/components/cargando';
import { Icono } from '../../../shared/components/icono';
import { Medidor } from '../../../shared/components/medidor';
import { EtiquetaPipe } from '../../../shared/pipes/etiqueta.pipe';
import { TPipe } from '../../../shared/pipes/t.pipe';
import { CalificarEvaluacion } from '../calificacion/calificar-evaluacion';
import { DetalleFactores } from '../factores/detalle-factores';
import { RankingCultivos } from '../ranking/ranking-cultivos';
import { TarjetaRentabilidad } from '../rentabilidad/tarjeta-rentabilidad';

/** Aviso de alcance referencial (US21, T99), siempre visible. */
const AVISO_REFERENCIAL = 'La recomendación es referencial: no reemplaza la evaluación de un ingeniero agrónomo '
  + 'ni garantiza el rendimiento de la cosecha.';

/**
 * Resultado de la evaluación (mockup de la figura 12; US18–US25).
 * Muestra los datos que se usaron en ese momento (la evaluación es una "foto"), el ranking con sus factores,
 * la explicación en lenguaje sencillo, el aviso referencial y la calificación.
 */
@Component({
  selector: 'app-resultado-evaluacion',
  imports: [RouterLink, DatePipe, DecimalPipe, LowerCasePipe, Aviso, Cargando, Icono, Medidor, EtiquetaPipe, TPipe,
    RankingCultivos, DetalleFactores, TarjetaRentabilidad, CalificarEvaluacion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './resultado-evaluacion.html',
  styleUrl: './resultado-evaluacion.scss',
})
export class ResultadoEvaluacion implements OnInit {
  private readonly evaluaciones = inject(EvaluacionService);

  /** Parámetro :id de la ruta. */
  readonly id = input.required<string>();

  protected readonly idioma = IDIOMA;
  protected readonly evaluacion = signal<Evaluacion | null>(null);
  protected readonly error = signal<string | null>(null);

  /** T96: fuentes que no respondieron, en lenguaje sencillo. */
  protected readonly fuentesFaltantes = computed(() =>
    (this.evaluacion()?.fuentesFaltantes ?? []).map((f) => etiqueta(f.trim())).join(', '));

  /** El cultivo con mejor puntaje, destacado arriba. */
  protected readonly mejor = computed(() => this.evaluacion()?.ranking[0] ?? null);

  /** T100: si el cultivo consultado salió con compatibilidad baja, se muestran hasta 3 alternativas. */
  protected readonly alternativas = computed(() => {
    const ev = this.evaluacion();
    const consultado = ev?.resultadoCultivoConsultado;
    if (!ev || !consultado || consultado.compatibilidad !== 'BAJA') {
      return [];
    }
    return ev.ranking.filter((r) => r.cultivoId !== consultado.cultivoId).slice(0, 3);
  });

  protected readonly parrafos = computed(() =>
    (this.evaluacion()?.explicacion ?? '').split(/\n+/).map((p) => p.trim()).filter(Boolean));

  protected readonly avisoReferencial = computed(() => {
    const aviso = this.evaluacion()?.aviso;
    return aviso ? tApi(aviso) : t(AVISO_REFERENCIAL);
  });

  ngOnInit(): void {
    this.evaluaciones.obtener(Number(this.id())).subscribe({
      next: (ev) => this.evaluacion.set(ev),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }
}
