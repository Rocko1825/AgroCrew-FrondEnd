import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { t } from '../../../core/i18n/idioma';
import { estadoError, mensajeError } from '../../../core/interceptors/auth.interceptor';
import { ErrorApi } from '../../../core/models/api.models';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { Aviso } from '../../../shared/components/aviso';
import { Boton } from '../../../shared/components/boton';
import { Icono } from '../../../shared/components/icono';
import { TPipe } from '../../../shared/pipes/t.pipe';
import { FondoAcceso } from './fondo-acceso';
import { PortadaAcceso } from './portada-acceso';
import {
  aplicarErroresServidor, errorDe, PATRON_PASSWORD, PATRON_TELEFONO,
} from '../../../shared/utils/formularios';

/**
 * Pantalla de acceso (mockup de la figura 10): portada con la propuesta de valor, inicio de sesión
 * (US02, T70–T71) y creación de cuenta (US01, T68–T69) en pestañas.
 */
@Component({
  selector: 'app-acceso',
  imports: [ReactiveFormsModule, RouterLink, Aviso, Boton, Icono, TPipe, PortadaAcceso, FondoAcceso],
  host: { '(document:keydown.escape)': 'fondoCompleto.set(false)' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './acceso.html',
  styleUrl: './acceso.scss',
})
export class Acceso implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);
  private readonly fb = inject(NonNullableFormBuilder);

  /** Parámetros de la URL: ?sesion=expirada, ?volver=/ruta y ?modo=registro. */
  readonly sesion = input<string>();
  readonly volver = input<string>();
  readonly modo = input<string>();

  protected readonly errorDe = errorDe;
  protected readonly pestana = signal<'login' | 'registro'>('login');

  /** Fondo de agricultores: se revela con la linterna del cursor; doble clic lo muestra completo. */
  protected readonly fondoCompleto = signal(false);
  private readonly fondo = viewChild(FondoAcceso);

  protected alternarFondo(e: MouseEvent): void {
    const objetivo = e.target as HTMLElement;
    // La interfaz sigue activa: el doble clic sobre el formulario o el panel no cambia el fondo.
    if (objetivo.closest('input, textarea, select, button, a, label, .panel, app-portada-acceso')) {
      return;
    }
    getSelection()?.removeAllRanges();
    if (!this.fondoCompleto()) {
      this.fondo()?.origen(e.clientX, e.clientY);
    }
    this.fondoCompleto.update((v) => !v);
  }

  protected verFondo(): void {
    this.fondo()?.origen(-1, -1);
    this.fondoCompleto.set(true);
  }

  protected readonly login = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly ingresando = signal(false);
  protected readonly errorLogin = signal<string | null>(null);
  protected readonly verPassword = signal(false);

  protected readonly registro = this.fb.group({
    nombres: ['', [Validators.required, Validators.maxLength(80)]],
    apellidos: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    password: ['', [Validators.required, Validators.pattern(PATRON_PASSWORD)]],
    telefono: ['', Validators.pattern(PATRON_TELEFONO)],
    organizacion: ['', Validators.maxLength(120)],
    tipoUsuario: this.fb.control<'PRODUCTOR' | 'ASESOR'>('PRODUCTOR', Validators.required),
  });
  protected readonly registrando = signal(false);
  protected readonly errorRegistro = signal<string | null>(null);

  ngOnInit(): void {
    if (this.modo() === 'registro') {
      this.pestana.set('registro');
    }
  }

  protected ingresar(): void {
    if (this.login.invalid) {
      this.login.markAllAsTouched();
      return;
    }
    this.errorLogin.set(null);
    this.ingresando.set(true);
    const { email, password } = this.login.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.irAlPanel(),
      error: (e) => {
        this.ingresando.set(false);
        // US02: un único mensaje, sin indicar si falló el correo o la contraseña.
        this.errorLogin.set(estadoError(e) === 401 ? t('Correo o contraseña incorrectos') : mensajeError(e));
      },
    });
  }

  protected registrarme(): void {
    if (this.registro.invalid) {
      this.registro.markAllAsTouched();
      return;
    }
    this.errorRegistro.set(null);
    this.registrando.set(true);
    const datos = this.registro.getRawValue();
    this.auth.registrar({
      ...datos,
      email: datos.email.trim(),
      telefono: datos.telefono || null,
      organizacion: datos.organizacion || null,
    }).pipe(
      // La API no devuelve token al registrar: se inicia sesión con los mismos datos.
      switchMap(() => this.auth.login(datos.email.trim(), datos.password)),
    ).subscribe({
      next: () => {
        this.notificaciones.exito(t('¡Tu cuenta fue creada! Bienvenido a AgroCrew.'));
        this.irAlPanel();
      },
      error: (e: ErrorApi) => {
        this.registrando.set(false);
        if (e.estado === 409) {
          this.registro.controls.email.setErrors({ servidor: t('El correo ya está registrado') });
          this.registro.controls.email.markAsTouched();
        } else {
          aplicarErroresServidor(this.registro, e.detalles);
          this.errorRegistro.set(mensajeError(e));
        }
      },
    });
  }

  private irAlPanel(): void {
    const destino = this.volver();
    this.router.navigateByUrl(destino && destino.startsWith('/') ? destino : this.auth.rutaInicio());
  }
}
