import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mensajeError } from '../../../core/interceptors/auth.interceptor';
import { AuthService } from '../../../core/services/auth.service';
import { Aviso } from '../../../shared/components/aviso';
import { Boton } from '../../../shared/components/boton';
import { TApiPipe, TPipe } from '../../../shared/pipes/t.pipe';
import { errorDe } from '../../../shared/utils/formularios';

/** "Olvidé mi contraseña" (US05, T74): pide el enlace de restablecimiento por correo. */
@Component({
  selector: 'app-recuperar',
  imports: [ReactiveFormsModule, RouterLink, Aviso, Boton, TPipe, TApiPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor pagina angosto">
      <section class="tarjeta panel">
        <h1>{{ '¿Olvidaste tu contraseña?' | t }}</h1>
        <p class="texto-suave">
          {{ 'Escribe el correo con el que te registraste y te enviaremos un enlace para crear una nueva. El enlace vence en 30 minutos.' | t }}
        </p>
        @if (enviado()) {
          <app-aviso tipo="exito" [titulo]="'Revisa tu correo' | t">{{ enviado()! | tApi }}</app-aviso>
          <p class="seccion-corta"><a routerLink="/acceso">{{ 'Volver a iniciar sesión' | t }}</a></p>
        } @else {
          <form class="formulario" [formGroup]="formulario" (ngSubmit)="enviar()" novalidate>
            <div class="campo">
              <label for="rec-email">{{ 'Correo electrónico' | t }}</label>
              <input id="rec-email" type="email" formControlName="email" autocomplete="email"
                     [attr.aria-invalid]="!!errorDe(formulario.controls.email)">
              @if (errorDe(formulario.controls.email); as e) { <span class="campo-error">{{ e }}</span> }
            </div>
            @if (error()) { <app-aviso tipo="error">{{ error() }}</app-aviso> }
            <button appBoton type="submit" [cargando]="enviando()" [textoCargando]="'Enviando…' | t">{{ 'Enviar enlace' | t }}</button>
            <a routerLink="/acceso">{{ 'Volver a iniciar sesión' | t }}</a>
          </form>
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
export class Recuperar {
  private readonly auth = inject(AuthService);
  protected readonly errorDe = errorDe;
  protected readonly formulario = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
  });
  protected readonly enviando = signal(false);
  protected readonly enviado = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.auth.solicitarRecuperacion(this.formulario.getRawValue().email.trim()).subscribe({
      next: (r) => this.enviado.set(r.mensaje),
      error: (e) => {
        this.enviando.set(false);
        this.error.set(mensajeError(e));
      },
    });
  }
}
