import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Alerta } from '../models/api.models';
import { ApiService } from './api.service';

/** Alertas del productor (US15, US16) y el contador de no leídas de la cabecera (T88). */
@Injectable({ providedIn: 'root' })
export class AlertaService {
  private readonly api = inject(ApiService);

  /** Cantidad de alertas sin leer que muestra la cabecera. */
  readonly noLeidas = signal(0);

  listar(leida?: boolean | null): Observable<Alerta[]> {
    return this.api.get<Alerta[]>('/alertas', { leida: leida ?? null });
  }

  refrescarContador(): void {
    this.api.get<{ noLeidas: number }>('/alertas/no-leidas/cantidad').subscribe({
      next: (r) => this.noLeidas.set(r.noLeidas),
      error: () => this.noLeidas.set(0),
    });
  }

  marcarLeida(id: number): Observable<void> {
    return this.api.patch<void>(`/alertas/${id}/leida`).pipe(
      tap(() => this.noLeidas.update((n) => Math.max(0, n - 1))),
    );
  }
}
