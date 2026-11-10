import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { t } from '../../core/i18n/idioma';
import { mensajeError } from '../../core/interceptors/auth.interceptor';
import { ErrorApi, Usuario } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { Aviso } from '../../shared/components/aviso';
import { Boton } from '../../shared/components/boton';
import { Cargando } from '../../shared/components/cargando';
import { EtiquetaPipe } from '../../shared/pipes/etiqueta.pipe';
import { TPipe } from '../../shared/pipes/t.pipe';
import { aplicarErroresServidor, errorDe, PATRON_TELEFONO } from '../../shared/utils/formularios';

/** Mi perfil (US04, T73): ver y editar nombre, teléfono y organización. */
@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, DatePipe, Aviso, Boton, Cargando, EtiquetaPipe, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor pagina angosto">
      <h1>{{ 'Mi perfil' | t }}</h1>
      @if (usuario(); as u) {
        <section class="tarjeta">
          <div class="cabecera-perfil">
            <span class="avatar" aria-hidden="true">{{ iniciales() }}</span>
            <div>
              <h2 class="h3 mb-0">{{ u.nombres }} {{ u.apellidos }}</h2>
              <p class="texto-suave mb-0">{{ u.email }}</p>
            </div>
            <span class="chip">{{ u.rol | etiqueta }}</span>
          </div>
          <p class="texto-suave registro">{{ 'Registrado el {fecha}' | t: { fecha: (u.fechaRegistro | date: 'longDate') } }}</p>
          <form class="formulario" [formGroup]="formulario" (ngSubmit)="guardar()" novalidate>
            <div class="grid-2">
              <div class="campo">
                <label for="perfil-nombres">{{ 'Nombres' | t }}</label>
                <input id="perfil-nombres" formControlName="nombres" autocomplete="given-name">
                @if (errorDe(formulario.controls.nombres); as e) { <span class="campo-error">{{ e }}</span> }
              </div>
              <div class="campo">
                <label for="perfil-apellidos">{{ 'Apellidos' | t }}</label>
                <input id="perfil-apellidos" formControlName="apellidos" autocomplete="family-name">
                @if (errorDe(formulario.controls.apellidos); as e) { <span class="campo-error">{{ e }}</span> }
              </div>
            </div>
            <div class="grid-2">
              <div class="campo">
                <label for="perfil-telefono">{{ 'Teléfono' | t }} <small>({{ 'opcional' | t }})</small></label>
                <input id="perfil-telefono" type="tel" inputmode="numeric" formControlName="telefono" autocomplete="tel">
                @if (errorDe(formulario.controls.telefono, 'El teléfono debe tener 9 dígitos.'); as e) {
                  <span class="campo-error">{{ e }}</span>
                }
              </div>
              <div class="campo">
                <label for="perfil-organizacion">{{ 'Organización' | t }} <small>({{ 'opcional' | t }})</small></label>
                <input id="perfil-organizacion" formControlName="organizacion" autocomplete="organization">
              </div>
            </div>
            @if (error()) { <app-aviso tipo="error">{{ error() }}</app-aviso> }
            <div class="fila fila-fin">
              <button appBoton type="submit" [cargando]="guardando()" [textoCargando]="'Guardando…' | t">{{ 'Guardar cambios' | t }}</button>
            </div>
          </form>
        </section>
      } @else if (error()) {
        <app-aviso tipo="error">{{ error() }}</app-aviso>
      } @else {
        <app-cargando [lineas]="5" />
      }
    </div>
  `,
  styles: `
    .cabecera-perfil { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .cabecera-perfil > div { flex: 1; min-width: 180px; }
    .avatar {
      display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%;
      background: #2F5D3A; color: #FFFFFF; font-size: 1.4rem; font-weight: 700;
    }
    .registro { margin: 12px 0 20px; font-size: 0.875rem; }
  `,
})
export class Perfil implements OnInit {
  private readonly usuarios = inject(UsuarioService);
  private readonly auth = inject(AuthService);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly errorDe = errorDe;
  protected readonly usuario = signal<Usuario | null>(null);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly iniciales = computed(() => {
    const u = this.usuario();
    return u ? `${u.nombres.charAt(0)}${u.apellidos.charAt(0)}`.toUpperCase() : '';
  });

  protected readonly formulario = inject(NonNullableFormBuilder).group({
    nombres: ['', [Validators.required, Validators.maxLength(80)]],
    apellidos: ['', [Validators.required, Validators.maxLength(80)]],
    telefono: ['', Validators.pattern(PATRON_TELEFONO)],
    organizacion: ['', Validators.maxLength(120)],
  });

  ngOnInit(): void {
    this.usuarios.perfil().subscribe({
      next: (u) => this.mostrar(u),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    const v = this.formulario.getRawValue();
    this.usuarios.actualizarPerfil({ ...v, telefono: v.telefono || null, organizacion: v.organizacion || null })
      .subscribe({
        next: (u) => {
          this.guardando.set(false);
          this.mostrar(u);
          this.auth.actualizarUsuario(u);
          this.notificaciones.exito(t('Tus datos se actualizaron.'));
        },
        error: (e: ErrorApi) => {
          this.guardando.set(false);
          aplicarErroresServidor(this.formulario, e.detalles);
          this.error.set(mensajeError(e));
        },
      });
  }

  private mostrar(u: Usuario): void {
    this.usuario.set(u);
    this.formulario.reset({
      nombres: u.nombres,
      apellidos: u.apellidos,
      telefono: u.telefono ?? '',
      organizacion: u.organizacion ?? '',
    });
  }
}
