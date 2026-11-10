import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Catastro, Clima, Predio, PredioSolicitud, Rentabilidad, Riesgo, Suelo,
} from '../models/api.models';
import { ApiService } from './api.service';

/** Predios del productor (US06–US10), su información (US11–US14), catastro (US07) y rentabilidad (US22). */
@Injectable({ providedIn: 'root' })
export class PredioService {
  private readonly api = inject(ApiService);

  listar(): Observable<Predio[]> {
    return this.api.get<Predio[]>('/predios');
  }

  obtener(id: number): Observable<Predio> {
    return this.api.get<Predio>(`/predios/${id}`);
  }

  registrar(datos: PredioSolicitud): Observable<Predio> {
    return this.api.post<Predio>('/predios', datos);
  }

  actualizar(id: number, datos: PredioSolicitud): Observable<Predio> {
    return this.api.put<Predio>(`/predios/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`/predios/${id}`);
  }

  suelo(id: number): Observable<Suelo> {
    return this.api.get<Suelo>(`/predios/${id}/suelo`);
  }

  clima(id: number): Observable<Clima> {
    return this.api.get<Clima>(`/predios/${id}/clima`);
  }

  riesgo(id: number): Observable<Riesgo> {
    return this.api.get<Riesgo>(`/predios/${id}/riesgo`);
  }

  buscarCatastro(codigo: string, departamentoId: number): Observable<Catastro> {
    return this.api.get<Catastro>(`/catastro/${encodeURIComponent(codigo)}`, { departamentoId });
  }

  rentabilidad(predioId: number, cultivoId: number): Observable<Rentabilidad> {
    return this.api.get<Rentabilidad>(`/predios/${predioId}/cultivos/${cultivoId}/rentabilidad`);
  }
}
