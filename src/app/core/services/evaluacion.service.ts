import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Calificacion, Evaluacion, EvaluacionResumen, Pagina } from '../models/api.models';
import { ApiService } from './api.service';

/** Evaluación y recomendación (US18–US25). */
@Injectable({ providedIn: 'root' })
export class EvaluacionService {
  private readonly api = inject(ApiService);

  /** Sin cultivoId: ranking general. Con cultivoId: evaluación de un cultivo específico (US23). */
  evaluar(predioId: number, cultivoId?: number | null): Observable<Evaluacion> {
    return this.api.post<Evaluacion>(`/predios/${predioId}/evaluaciones`, cultivoId ? { cultivoId } : {});
  }

  historial(predioId: number, pagina = 0, tamano = 5): Observable<Pagina<EvaluacionResumen>> {
    return this.api.get<Pagina<EvaluacionResumen>>(`/predios/${predioId}/evaluaciones`, { pagina, tamano });
  }

  obtener(id: number): Observable<Evaluacion> {
    return this.api.get<Evaluacion>(`/evaluaciones/${id}`);
  }

  /** Devuelve null si la evaluación todavía no tiene calificación (204). */
  calificacion(evaluacionId: number): Observable<Calificacion | null> {
    return this.api.get<Calificacion | null>(`/evaluaciones/${evaluacionId}/calificacion`);
  }

  calificar(evaluacionId: number, puntaje: number, comentario: string | null): Observable<Calificacion> {
    return this.api.post<Calificacion>(`/evaluaciones/${evaluacionId}/calificacion`, { puntaje, comentario });
  }
}
