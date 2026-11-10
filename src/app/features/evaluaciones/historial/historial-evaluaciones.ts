import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { mensajeError } from '../../../core/interceptors/auth.interceptor';
import { EvaluacionResumen, Pagina } from '../../../core/models/api.models';
import { EvaluacionService } from '../../../core/services/evaluacion.service';
import { Aviso } from '../../../shared/components/aviso';
import { Cargando } from '../../../shared/components/cargando';
import { Paginador } from '../../../shared/components/paginador';
import { EtiquetaPipe } from '../../../shared/pipes/etiqueta.pipe';
import { TPipe } from '../../../shared/pipes/t.pipe';

/**
 * Historial de evaluaciones del predio (US24, T101): lista paginada de la más reciente a la más antigua.
 * Cada fila lleva al detalle con los datos usados en ese momento.
 */
@Component({
  selector: 'app-historial-evaluaciones',
  imports: [RouterLink, DatePipe, DecimalPipe, Aviso, Cargando, Paginador, EtiquetaPipe, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tarjeta' },
  template: `
    <div class="titulo-con-icono">
      <h2 class="h3">{{ 'Historial de evaluaciones' | t }}</h2>
    </div>
    @if (error()) {
      <app-aviso tipo="error">{{ error() }}</app-aviso>
    } @else if (!pagina()) {
      <app-cargando [lineas]="3" />
    } @else if (pagina()!.content.length === 0) {
      <p class="texto-suave">{{ 'Todavía no evaluaste este predio. Usa el botón «Evaluar» para obtener tu primer ranking.' | t }}</p>
    } @else {
      <div class="tabla-contenedor">
        <table>
          <caption class="sr-only">{{ 'Evaluaciones del predio' | t }}</caption>
          <thead>
            <tr><th scope="col">{{ 'Fecha' | t }}</th><th scope="col">{{ 'Tipo' | t }}</th><th scope="col">{{ 'Estado' | t }}</th>
              <th scope="col">{{ 'Mejor cultivo' | t }}</th><th scope="col">{{ 'Compatibles' | t }}</th>
              <th scope="col"><span class="sr-only">{{ 'Acción' | t }}</span></th></tr>
          </thead>
          <tbody>
            @for (e of pagina()!.content; track e.id) {
              <tr>
                <td>{{ e.fecha | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ e.tipo | etiqueta }}</td>
                <td><span class="estado-punto" [class.bien]="e.estado === 'COMPLETADA'" [class.atencion]="e.estado === 'PARCIAL'">{{ e.estado | etiqueta }}</span></td>
                <td>{{ e.mejorCultivo ? e.mejorCultivo + ' (' + (e.mejorPuntaje | number: '1.0-0') + ')' : '—' }}</td>
                <td>{{ e.cultivosCompatibles }}</td>
                <td><a class="ver" [routerLink]="['/evaluaciones', e.id]">{{ 'Ver detalle' | t }}</a></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-paginador [pagina]="pagina()!.page.number" [totalPaginas]="pagina()!.page.totalPages" (cambiar)="cargar($event)" />
    }
  `,
  styles: `:host { display: block; } .ver { white-space: nowrap; font-weight: 600; }`,
})
export class HistorialEvaluaciones implements OnInit {
  private readonly evaluaciones = inject(EvaluacionService);
  readonly predioId = input.required<number>();

  protected readonly pagina = signal<Pagina<EvaluacionResumen> | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar(0);
  }

  protected cargar(numero: number): void {
    this.evaluaciones.historial(this.predioId(), numero, 5).subscribe({
      next: (p) => this.pagina.set(p),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }
}
