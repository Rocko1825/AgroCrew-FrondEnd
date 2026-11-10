import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { t, tApi } from '../../../core/i18n/idioma';
import { estadoError, mensajeError } from '../../../core/interceptors/auth.interceptor';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { Aviso } from '../../../shared/components/aviso';
import { Boton } from '../../../shared/components/boton';
import { Cargando } from '../../../shared/components/cargando';
import { TPipe } from '../../../shared/pipes/t.pipe';
import { errorDe, PATRON_PASSWORD } from '../../../shared/utils/formularios';

type EstadoEnlace = 'validando' | 'valido' | 'expirado' | 'invalido';

/**
 * Restablecer la contraseña desde el enlace del correo (US05, T74–T75).
 * Si el enlace venció (410) o ya se usó (400), se ofrece pedir uno nuevo.
 */
@Component({
  selector: 'app-restablecer',
  imports: [ReactiveFormsModule, RouterLink, Aviso, Boton, Cargando, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor pagina angosto">
      <section class="tarjeta panel">
        <h1>{{ 'Crea una nueva contraseña' | t }}</h1>
        @switch (estado()) {
          @case ('validando') { <app-cargando [texto]="'Revisando tu enlace…' | t" [lineas]="2" /> }
          @case ('expirado') {
            <app-aviso tipo="advertencia" [titulo]="'El enlace expiró' | t">
              {{ 'Por seguridad, el enlace solo es válido por 30 minutos. Pide uno nuevo y úsalo apenas te llegue.' | t }}
            </app-aviso>
            <p class="seccion-corta"><a class="btn" routerLink="/recuperar">{{ 'Solicitar un nuevo enlace' | t }}</a></p>
          }
          @case ('invalido') {
            <app-aviso tipo="error" [titulo]="'El enlace no es válido' | t">{{ mensaje() }}</app-aviso>
            <p class="seccion-corta"><a class="btn" routerLink="/recuperar">{{ 'Solicitar un nuevo enlace' | t }}</a></p>
          }
          @case ('valido') {
            <form class="formulario" [formGroup]="formulario" (ngSubmit)="guardar()" novalidate>
              <div class="campo">
                <label for="nueva">{{ 'Nueva contraseña' | t }}</label>
                <input id="nueva" type="password" formControlName="nueva" autocomplete="new-password" aria-describedby="nueva-ayuda">
                <span id="nueva-ayuda" class="ayuda">{{ 'Mínimo 8 caracteres, con letras y números.' | t }}</span>
                @if (errorDe(formulario.controls.nueva, 'La contraseña debe tener al menos 8 caracteres, con letras y números.'); as e) {
                  <span class="campo-error">{{ e }}</span>
                }
              </div>
              <div class="campo">
                <label for="repetir">{{ 'Repite la contraseña' | t }}</label>
                <input id="repetir" type="password" formControlName="repetir" autocomplete="new-password">
                @if (formulario.controls.repetir.touched && formulario.hasError('distintas')) {
                  <span class="campo-error">{{ 'Las contraseñas no coinciden.' | t }}</span>
                }
              </div>
              @if (error()) { <app-aviso tipo="error">{{ error() }}</app-aviso> }
              <button appBoton type="submit" [cargando]="guardando()" [textoCargando]="'Guardando…' | t">{{ 'Guardar contraseña' | t }}</button>
            </form>
          }
        }
      </section>
    </div>
  `,
  styles: `
    .panel { padding: 32px; border-radius: 16px; }
    .grande { width: 56px; height: 56px; margin-bottom: 12px; }
    h1 { font-size: 1.9rem; }
  `,
})
export class Restablecer implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);

  /** ?token=... del enlace recibido por correo. */
  readonly token = input<string>();

  protected readonly errorDe = errorDe;
  protected readonly estado = signal<EstadoEnlace>('validando');
  protected readonly mensaje = signal('');
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly formulario = inject(NonNullableFormBuilder).group({
    nueva: ['', [Validators.required, Validators.pattern(PATRON_PASSWORD)]],
    repetir: ['', Validators.required],
  }, {
    validators: (g: AbstractControl) => (g.get('nueva')?.value === g.get('repetir')?.value ? null : { distintas: true }),
  });

  ngOnInit(): void {
    const token = this.token();
    if (!token) {
      this.marcarInvalido(t('El enlace está incompleto. Ábrelo directamente desde el correo.'));
      return;
    }
    this.auth.validarEnlace(token).subscribe({
      next: () => this.estado.set('valido'),
      error: (e) => (estadoError(e) === 410 ? this.estado.set('expirado') : this.marcarInvalido(mensajeError(e))),
    });
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    this.auth.restablecer(this.token()!, this.formulario.getRawValue().nueva).subscribe({
      next: (r) => {
        this.notificaciones.exito(tApi(r.mensaje));
        this.router.navigate(['/acceso']);
      },
      error: (e) => {
        this.guardando.set(false);
        if (estadoError(e) === 410) {
          this.estado.set('expirado');
        } else {
          this.error.set(mensajeError(e));
        }
      },
    });
  }

  private marcarInvalido(mensaje: string): void {
    this.mensaje.set(mensaje);
    this.estado.set('invalido');
  }
}
