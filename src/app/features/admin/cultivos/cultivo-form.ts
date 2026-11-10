import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { t } from '../../../core/i18n/idioma';
import { mensajeError } from '../../../core/interceptors/auth.interceptor';
import {
  Cultivo, CultivoSolicitud, ErrorApi, GrupoCum, TipoCultivo, ToleranciaInundacion,
} from '../../../core/models/api.models';
import { CultivoService } from '../../../core/services/cultivo.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { Aviso } from '../../../shared/components/aviso';
import { Boton } from '../../../shared/components/boton';
import { Cargando } from '../../../shared/components/cargando';
import { Icono } from '../../../shared/components/icono';
import { TApiPipe, TPipe } from '../../../shared/pipes/t.pipe';
import { aplicarErroresServidor, errorDe, minimoNoMayorQueMaximo } from '../../../shared/utils/formularios';

/**
 * Registrar y editar un cultivo (US30, T111) con sus requerimientos agronómicos (US31, T112):
 * rangos de altitud, temperatura y lluvia, grupos CUM aptos y tolerancia a inundación.
 */
@Component({
  selector: 'app-cultivo-form',
  imports: [ReactiveFormsModule, RouterLink, Aviso, Boton, Cargando, Icono, TPipe, TApiPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cultivo-form.html',
  styles: `
    .grupos { display: grid; gap: 10px; }
    .grupo { display: flex; gap: 10px; align-items: flex-start; font-weight: 400; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--color-borde); cursor: pointer; transition: border-color 0.2s ease, background-color 0.2s ease; }
    .grupo:has(input:checked) { border-color: var(--color-acento); background: var(--color-marca-claro); }
    .grupo input { margin-top: 5px; }
    .rangos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 16px; }
    .rangos .error-rango { grid-column: 1 / -1; }
  `,
})
export class CultivoForm implements OnInit {
  private readonly servicio = inject(CultivoService);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly id = input<string>();
  protected readonly esEdicion = computed(() => !!this.id());

  protected readonly errorDe = errorDe;
  protected readonly gruposDisponibles = signal<GrupoCum[]>([]);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly requerimiento = this.fb.group({
    altitudMin: this.fb.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(6800)]),
    altitudMax: this.fb.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(6800)]),
    temperaturaMin: this.fb.control<number | null>(null, [Validators.required, Validators.min(-20), Validators.max(50)]),
    temperaturaMax: this.fb.control<number | null>(null, [Validators.required, Validators.min(-20), Validators.max(50)]),
    precipitacionMinMm: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    precipitacionMaxMm: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    toleranciaInundacion: this.fb.control<ToleranciaInundacion>('BAJA', Validators.required),
    requiereRiego: false,
  }, {
    validators: [
      minimoNoMayorQueMaximo('altitudMin', 'altitudMax', 'La altitud mínima no puede ser mayor que la máxima.'),
      minimoNoMayorQueMaximo('temperaturaMin', 'temperaturaMax', 'La temperatura mínima no puede ser mayor que la máxima.'),
      minimoNoMayorQueMaximo('precipitacionMinMm', 'precipitacionMaxMm', 'La lluvia mínima no puede ser mayor que la máxima.'),
    ],
  });

  protected readonly formulario = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(60)]],
    nombreCientifico: ['', Validators.maxLength(100)],
    tipo: this.fb.control<TipoCultivo>('TRANSITORIO', Validators.required),
    cicloDias: this.fb.control<number | null>(null, Validators.min(1)),
    descripcion: ['', Validators.maxLength(500)],
    gruposCum: this.fb.control<string[]>([]),
    requerimiento: this.requerimiento,
  });

  ngOnInit(): void {
    this.servicio.gruposCum().subscribe((g) => this.gruposDisponibles.set(g));
    if (this.esEdicion()) {
      this.cargando.set(true);
      this.servicio.obtener(Number(this.id())).subscribe({
        next: (c) => {
          this.mostrar(c);
          this.cargando.set(false);
        },
        error: (e) => {
          this.cargando.set(false);
          this.error.set(mensajeError(e));
        },
      });
    }
  }

  protected errorRango(campo: string): string | null {
    const e = this.requerimiento.errors?.[`rango_${campo}`];
    return e && this.requerimiento.touched ? String(e) : null;
  }

  protected grupoMarcado(codigo: string): boolean {
    return this.formulario.controls.gruposCum.value.includes(codigo);
  }

  protected alternarGrupo(codigo: string, marcado: boolean): void {
    const actuales = this.formulario.controls.gruposCum.value.filter((g) => g !== codigo);
    this.formulario.controls.gruposCum.setValue(marcado ? [...actuales, codigo] : actuales);
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set(t('Revisa los datos marcados antes de guardar.'));
      return;
    }
    const v = this.formulario.getRawValue();
    const r = v.requerimiento;
    const datos: CultivoSolicitud = {
      nombre: v.nombre.trim(),
      nombreCientifico: v.nombreCientifico.trim() || null,
      tipo: v.tipo,
      cicloDias: v.cicloDias ?? null,
      descripcion: v.descripcion.trim() || null,
      gruposCum: v.gruposCum,
      requerimiento: {
        altitudMin: r.altitudMin!, altitudMax: r.altitudMax!,
        temperaturaMin: r.temperaturaMin!, temperaturaMax: r.temperaturaMax!,
        precipitacionMinMm: r.precipitacionMinMm!, precipitacionMaxMm: r.precipitacionMaxMm!,
        toleranciaInundacion: r.toleranciaInundacion, requiereRiego: r.requiereRiego,
      },
    };
    this.guardando.set(true);
    this.error.set(null);
    const peticion = this.esEdicion()
      ? this.servicio.actualizar(Number(this.id()), datos)
      : this.servicio.registrar(datos);
    peticion.subscribe({
      next: (c) => {
        this.notificaciones.exito(t(this.esEdicion() ? 'Guardamos los cambios de {cultivo}.' : '{cultivo} se agregó al catálogo.', { cultivo: c.nombre }));
        this.router.navigate(['/admin/cultivos']);
      },
      error: (e: ErrorApi) => {
        this.guardando.set(false);
        if (e.estado === 409) {
          this.formulario.controls.nombre.setErrors({ servidor: e.mensaje });
          this.formulario.controls.nombre.markAsTouched();
        }
        aplicarErroresServidor(this.formulario, e.detalles);
        aplicarErroresServidor(this.requerimiento, e.detalles);
        this.error.set(mensajeError(e));
      },
    });
  }

  private mostrar(c: Cultivo): void {
    this.formulario.patchValue({
      nombre: c.nombre,
      nombreCientifico: c.nombreCientifico ?? '',
      tipo: c.tipo,
      cicloDias: c.cicloDias ?? null,
      descripcion: c.descripcion ?? '',
      gruposCum: [...c.gruposCum],
      requerimiento: { ...c.requerimiento },
    });
  }
}
