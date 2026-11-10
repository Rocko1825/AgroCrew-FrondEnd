import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { mensajeError } from '../../../core/interceptors/auth.interceptor';
import { Cultivo, Evaluacion } from '../../../core/models/api.models';
import { CultivoService } from '../../../core/services/cultivo.service';
import { EvaluacionService } from '../../../core/services/evaluacion.service';
import { Aviso } from '../../../shared/components/aviso';
import { Boton } from '../../../shared/components/boton';
import { Icono } from '../../../shared/components/icono';
import { TPipe } from '../../../shared/pipes/t.pipe';

/**
 * Solicitud de evaluación (US18, T94): botón "Evaluar" con estado de carga.
 * También permite evaluar un cultivo específico elegido del catálogo (US23, T100).
 */
@Component({
  selector: 'app-panel-evaluar',
  imports: [FormsModule, Aviso, Boton, Icono, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tarjeta' },
  template: `
    <div class="titulo-con-icono">
      <div>
        <h2 class="h3">{{ 'Evaluar mi predio' | t }}</h2>
        <p class="texto-suave mb-0">
          {{ 'Cruzamos el suelo, la altitud, el clima, el agua y el riesgo de tu predio con los requerimientos de cada cultivo.' | t }}
        </p>
      </div>
    </div>

    <div class="modos" role="radiogroup" [attr.aria-label]="'¿Qué quieres saber?' | t">
      <label class="modo">
        <input type="radio" name="modo" value="general" [ngModel]="modo()" (ngModelChange)="cambiarModo($event)">
        <span><app-icono nombre="grafico" /> <strong>{{ 'Qué cultivos le van mejor' | t }}</strong>
          <small>{{ 'Ranking de hasta 10 cultivos' | t }}</small></span>
      </label>
      <label class="modo">
        <input type="radio" name="modo" value="especifico" [ngModel]="modo()" (ngModelChange)="cambiarModo($event)">
        <span><app-icono nombre="busqueda" /> <strong>{{ 'Si un cultivo en particular es compatible' | t }}</strong>
          <small>{{ 'Y cuáles son mejores alternativas' | t }}</small></span>
      </label>
    </div>

    @if (modo() === 'especifico') {
      <div class="campo seccion-corta desplegable">
        <label for="cultivo-especifico">{{ 'Cultivo' | t }}</label>
        <select id="cultivo-especifico" [ngModel]="cultivoId()" (ngModelChange)="cultivoId.set($event)">
          <option [ngValue]="null" disabled>{{ (cultivos().length ? 'Elige un cultivo' : 'Cargando cultivos…') | t }}</option>
          @for (c of cultivos(); track c.id) { <option [ngValue]="c.id">{{ c.nombre }}</option> }
        </select>
      </div>
    }

    @if (error()) {
      <app-aviso tipo="error" class="seccion-corta">{{ error() }}</app-aviso>
    }
    <div class="fila seccion-corta">
      <button appBoton type="button" [cargando]="evaluando()" [textoCargando]="'Evaluando tu predio…' | t"
              [deshabilitado]="modo() === 'especifico' && !cultivoId()" (click)="evaluar()">
        <app-icono nombre="chispa" [tamano]="18" /> {{ 'Evaluar' | t }}
      </button>
      @if (evaluando()) {
        <span class="texto-suave" role="status">{{ 'Consultamos MIDAGRI, ANA y Open-Meteo; puede tardar unos segundos.' | t }}</span>
      }
    </div>
  `,
  styles: `
    :host { display: block; border-top: 4px solid var(--color-marca); }
    .destacado { background: var(--color-marca); color: #FFFFFF; }
    .modos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 4px; }
    @media (max-width: 768px) { .modos { grid-template-columns: 1fr; } }
    .modo { position: relative; cursor: pointer; }
    .modo input { position: absolute; opacity: 0; }
    .modo span {
      display: grid; gap: 2px; height: 100%; padding: 12px 14px; border-radius: 10px;
      border: 2px solid var(--color-borde); transition: border-color 0.2s ease, background-color 0.2s ease;
    }
    .modo app-icono { color: var(--color-acento); margin-bottom: 4px; }
    .modo small { color: var(--color-texto-suave); }
    .modo input:checked + span { border-color: var(--color-acento); background: var(--color-marca-claro); }
    .modo input:focus-visible + span { box-shadow: var(--anillo-foco); }
    .modo:hover span { border-color: var(--color-acento-suave); }
  `,
})
export class PanelEvaluar {
  private readonly evaluaciones = inject(EvaluacionService);
  private readonly catalogo = inject(CultivoService);

  readonly predioId = input.required<number>();
  readonly evaluado = output<Evaluacion>();

  protected readonly modo = signal<'general' | 'especifico'>('general');
  protected readonly cultivos = signal<Cultivo[]>([]);
  protected readonly cultivoId = signal<number | null>(null);
  protected readonly evaluando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected cambiarModo(modo: 'general' | 'especifico'): void {
    this.modo.set(modo);
    if (modo === 'especifico' && this.cultivos().length === 0) {
      this.catalogo.listarActivos().subscribe({
        next: (l) => this.cultivos.set([...l].sort((a, b) => a.nombre.localeCompare(b.nombre))),
        error: (e) => this.error.set(mensajeError(e)),
      });
    }
  }

  protected evaluar(): void {
    this.error.set(null);
    this.evaluando.set(true);
    const cultivo = this.modo() === 'especifico' ? this.cultivoId() : null;
    this.evaluaciones.evaluar(this.predioId(), cultivo).subscribe({
      next: (ev) => {
        this.evaluando.set(false);
        this.evaluado.emit(ev);
      },
      error: (e) => {
        this.evaluando.set(false);
        this.error.set(mensajeError(e));
      },
    });
  }
}
