import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Indicadores, PuntoCritico, ReporteConteo, ReporteCultivo, ReporteMensual, ReporteNivelRiesgo,
} from '../models/api.models';
import { ApiService } from './api.service';

/** Reportes del dashboard (US26–US29, US34), roles ASESOR y ADMIN, y puntos críticos para los mapas. */
@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly api = inject(ApiService);

  indicadores(): Observable<Indicadores> {
    return this.api.get<Indicadores>('/reportes/indicadores');
  }

  prediosPorDepartamento(): Observable<ReporteConteo[]> {
    return this.api.get<ReporteConteo[]>('/reportes/predios-por-departamento');
  }

  evaluacionesPorGrupoCum(departamentoId?: number | null): Observable<ReporteConteo[]> {
    return this.api.get<ReporteConteo[]>('/reportes/evaluaciones-por-grupo-cum', { departamentoId });
  }

  cultivosMasRecomendados(departamentoId?: number | null, desde?: string | null,
                          hasta?: string | null): Observable<ReporteCultivo[]> {
    return this.api.get<ReporteCultivo[]>('/reportes/cultivos-mas-recomendados', { departamentoId, desde, hasta });
  }

  puntosCriticosPorDepartamento(): Observable<ReporteNivelRiesgo[]> {
    return this.api.get<ReporteNivelRiesgo[]>('/reportes/puntos-criticos-por-departamento');
  }

  prediosPorNivelRiesgo(): Observable<ReporteNivelRiesgo[]> {
    return this.api.get<ReporteNivelRiesgo[]>('/reportes/predios-por-nivel-riesgo');
  }

  alertasPorMes(anio: number): Observable<ReporteMensual[]> {
    return this.api.get<ReporteMensual[]>('/reportes/alertas-por-mes', { anio });
  }

  /** Puntos críticos de la ANA alrededor de una coordenada (radio de 1 a 50 km). */
  puntosCriticos(latitud: number, longitud: number, radioKm: number): Observable<PuntoCritico[]> {
    return this.api.get<PuntoCritico[]>('/puntos-criticos', {
      latitud: latitud.toFixed(5), longitud: longitud.toFixed(5), radioKm: Math.round(radioKm),
    });
  }
}
