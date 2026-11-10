import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { t, tApi } from '../../../core/i18n/idioma';
import { mensajeError } from '../../../core/interceptors/auth.interceptor';
import { EvaluacionService } from '../../../core/services/evaluacion.service';
import { Aviso } from '../../../shared/components/aviso';
import { Boton } from '../../../shared/components/boton';
import { TPipe } from '../../../shared/pipes/t.pipe';

const DESCRIPCION_PUNTAJE = ['', 'Nada útil', 'Poco útil', 'Útil', 'Muy útil', '¡Excelente!'];

/**
 * Calificación de la recomendación (US25, T103): de 1 a 5 con comentario opcional y agradecimiento.
 * Si el productor ya calificó, se muestra su calificación y al volver a enviar se actualiza.
 */
@Component({
  selector: 'app-calificar-evaluacion',
  imports: [FormsModule, Aviso, Boton, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tarjeta' },
  template: `
    <div class="titulo-con-icono">
      <h2 class="h3">{{ '¿Te fue útil esta recomendación?' | t }}</h2>
    </div>
    <form (ngSubmit)="enviar()">
      <fieldset class="estrellas-campo">
        <legend>{{ 'Califica de 1 (nada útil) a 5 (muy útil)' | t }}</legend>
        <div class="estrellas" (mouseleave)="sobre.set(0)">
          @for (n of [1, 2, 3, 4, 5]; track n) {
            <label [class.activa]="n <= (sobre() || puntaje())" (mouseenter)="sobre.set(n)">
              <input class="sr-only" type="radio" name="puntaje" [value]="n" [ngModel]="puntaje()" (ngModelChange)="puntaje.set($event)">
              <span aria-hidden="true">★</span>
              <span class="sr-only">{{ '{n} de 5' | t: { n: n } }}</span>
            </label>
          }
          @if (descripcion()) { <span class="descripcion">{{ descripcion() }}</span> }
        </div>
      </fieldset>
      <div class="campo seccion-corta">
        <label for="calificacion-comentario">{{ 'Comentario' | t }} <small>({{ 'opcional' | t }})</small></label>
        <textarea id="calificacion-comentario" name="comentario" maxlength="500"
                  [ngModel]="comentario()" (ngModelChange)="comentario.set($event)"
                  [placeholder]="'Cuéntanos qué te sirvió o qué podríamos mejorar' | t"></textarea>
      </div>
      @if (gracias()) { <app-aviso tipo="exito" class="seccion-corta">{{ gracias() }}</app-aviso> }
      @if (error()) { <app-aviso tipo="error" class="seccion-corta">{{ error() }}</app-aviso> }
      <div class="fila seccion-corta">
        <button appBoton type="submit" [cargando]="enviando()" [deshabilitado]="puntaje() === 0">
          {{ (yaCalificada() ? 'Actualizar mi calificación' : 'Enviar calificación') | t }}
        </button>
      </div>
    </form>
  `,
  styles: `
    :host { display: block; }
    .estrellas-campo { border: none; padding: 0; }
    .estrellas { display: flex; align-items: center; gap: 4px; }
    .estrellas label { font-size: 2.2rem; line-height: 1; color: var(--color-pista); cursor: pointer; transition: transform 0.15s var(--curva), color 0.15s ease; }
    .estrellas label:hover { transform: scale(1.18); }
    .estrellas label.activa { color: #D9A520; }
    .estrellas label:focus-within { outline: 3px solid var(--color-acento); outline-offset: 2px; border-radius: 4px; }
    .descripcion { margin-left: 10px; font-weight: 600; color: var(--color-acento); animation: emerger 0.2s ease both; }
  `,
})
export class CalificarEvaluacion implements OnInit {
  private readonly evaluaciones = inject(EvaluacionService);
  readonly evaluacionId = input.required<number>();

  protected readonly puntaje = signal(0);
  protected readonly sobre = signal(0);
  protected readonly comentario = signal('');
  protected readonly yaCalificada = signal(false);
  protected readonly enviando = signal(false);
  protected readonly gracias = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly descripcion = computed(() => {
    const n = this.sobre() || this.puntaje();
    return n ? t(DESCRIPCION_PUNTAJE[n]) : '';
  });

  ngOnInit(): void {
    this.evaluaciones.calificacion(this.evaluacionId()).subscribe({
      next: (c) => {
        if (c) {
          this.puntaje.set(c.puntaje);
          this.comentario.set(c.comentario ?? '');
          this.yaCalificada.set(true);
        }
      },
      error: () => { /* Sin calificación previa: se muestra el formulario vacío. */ },
    });
  }

  protected enviar(): void {
    if (this.puntaje() === 0) {
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.gracias.set(null);
    this.evaluaciones.calificar(this.evaluacionId(), this.puntaje(), this.comentario().trim() || null).subscribe({
      next: (c) => {
        this.enviando.set(false);
        this.yaCalificada.set(true);
        this.gracias.set(c.mensaje ? tApi(c.mensaje) : t('¡Gracias por tu respuesta!'));
      },
      error: (e) => {
        this.enviando.set(false);
        this.error.set(mensajeError(e));
      },
    });
  }
}
