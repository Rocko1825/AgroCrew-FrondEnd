import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, OnInit, signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { t, tApi } from '../../../core/i18n/idioma';
import { estadoError, mensajeError } from '../../../core/interceptors/auth.interceptor';
import { Catastro, ErrorApi, FuenteAgua, PredioSolicitud, Ubigeo } from '../../../core/models/api.models';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { PredioService } from '../../../core/services/predio.service';
import { UbigeoService } from '../../../core/services/ubigeo.service';
import { Aviso } from '../../../shared/components/aviso';
import { Boton } from '../../../shared/components/boton';
import { Cargando } from '../../../shared/components/cargando';
import { Icono } from '../../../shared/components/icono';
import { Mapa } from '../../../shared/components/mapa';
import { TPipe } from '../../../shared/pipes/t.pipe';
import { aplicarErroresServidor, enRango, errorDe, LIMITES_PERU } from '../../../shared/utils/formularios';

type EstadoCatastro = 'inicial' | 'buscando' | 'encontrado' | 'no-encontrado' | 'no-disponible';

/**
 * Registro y edición de predio (US06, US09; T76–T78, T80) y búsqueda por código catastral (US07, T82–T83).
 * El mismo formulario sirve para registrar (/predios/nuevo) y editar (/predios/:id/editar).
 */
@Component({
  selector: 'app-predio-form',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, Aviso, Boton, Cargando, Mapa, Icono, TPipe],
  styleUrl: './predio-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './predio-form.html',
})
export class PredioForm implements OnInit {
  private readonly predios = inject(PredioService);
  private readonly ubigeo = inject(UbigeoService);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);

  /** Id del predio en la ruta de edición. */
  readonly id = input<string>();
  protected readonly esEdicion = computed(() => !!this.id());

  protected readonly errorDe = errorDe;
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly departamentos = signal<Ubigeo[]>([]);
  protected readonly provincias = signal<Ubigeo[]>([]);
  protected readonly distritos = signal<Ubigeo[]>([]);

  protected readonly formulario = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    departamentoId: this.fb.control<number | null>(null, Validators.required),
    provinciaId: this.fb.control<number | null>(null, Validators.required),
    distritoId: this.fb.control<number | null>(null, Validators.required),
    latitud: this.fb.control<number | null>(null, [Validators.required, enRango(LIMITES_PERU.latMin, LIMITES_PERU.latMax)]),
    longitud: this.fb.control<number | null>(null, [Validators.required, enRango(LIMITES_PERU.lngMin, LIMITES_PERU.lngMax)]),
    altitudMsnm: this.fb.control<number | null>(null, [Validators.min(0), Validators.max(6800)]),
    areaHa: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01), Validators.max(100000)]),
    fuenteAgua: this.fb.control<FuenteAgua>('SECANO', Validators.required),
    codigoCatastral: ['', Validators.maxLength(30)],
  });

  /** Punto marcado en el mapa (sigue a latitud y longitud del formulario). */
  protected readonly punto = signal<[number, number] | null>(null);
  protected readonly centroMapa = signal<[number, number] | null>(null);
  protected readonly zoomMapa = signal(5);

  // ---------- Código catastral (US07) ----------
  protected readonly catastro = this.fb.group({
    departamentoId: this.fb.control<number | null>(null, Validators.required),
    codigo: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{1,20}$/)]],
  });
  protected readonly estadoCatastro = signal<EstadoCatastro>('inicial');
  protected readonly resultadoCatastro = signal<Catastro | null>(null);
  protected readonly mensajeCatastro = signal('');

  ngOnInit(): void {
    this.ubigeo.departamentos().subscribe({
      next: (d) => {
        this.departamentos.set(d);
        if (this.esEdicion()) {
          this.cargarPredio(Number(this.id()));
        }
      },
      error: (e) => this.error.set(mensajeError(e)),
    });

    const c = this.formulario.controls;
    c.departamentoId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => {
      c.provinciaId.setValue(null, { emitEvent: false });
      c.distritoId.setValue(null);
      this.provincias.set([]);
      this.distritos.set([]);
      if (id) {
        this.ubigeo.provincias(id).subscribe((l) => this.provincias.set(l));
      }
    });
    c.provinciaId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => {
      c.distritoId.setValue(null);
      this.distritos.set([]);
      if (id) {
        this.ubigeo.distritos(id).subscribe((l) => this.distritos.set(l));
      }
    });
    // Si el productor escribe las coordenadas, el punto del mapa se mueve con ellas.
    this.formulario.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.actualizarPunto());
  }

  /** Clic en el mapa: fija la ubicación del predio. */
  protected marcarEnMapa(p: { latitud: number; longitud: number }): void {
    this.formulario.patchValue({ latitud: p.latitud, longitud: p.longitud });
    this.formulario.controls.latitud.markAsTouched();
    this.formulario.controls.longitud.markAsTouched();
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set(t('Revisa los datos marcados antes de guardar.'));
      return;
    }
    const v = this.formulario.getRawValue();
    const datos: PredioSolicitud = {
      nombre: v.nombre.trim(),
      distritoId: v.distritoId!,
      latitud: v.latitud!,
      longitud: v.longitud!,
      altitudMsnm: v.altitudMsnm ?? null,
      areaHa: v.areaHa!,
      fuenteAgua: v.fuenteAgua,
      codigoCatastral: v.codigoCatastral.trim() || null,
    };
    this.guardando.set(true);
    this.error.set(null);
    const peticion = this.esEdicion()
      ? this.predios.actualizar(Number(this.id()), datos)
      : this.predios.registrar(datos);
    peticion.subscribe({
      next: (p) => {
        this.notificaciones.exito(t(this.esEdicion() ? 'Guardamos los cambios de tu predio.' : '¡Tu predio quedó registrado!'));
        this.router.navigate(['/predios', p.id]);
      },
      error: (e: ErrorApi) => {
        this.guardando.set(false);
        if (e.mensaje === tApi('El distrito seleccionado no es válido')) {
          this.formulario.controls.distritoId.setErrors({ servidor: e.mensaje });
        }
        aplicarErroresServidor(this.formulario, e.detalles);
        this.error.set(mensajeError(e));
      },
    });
  }

  // ---------- Código catastral ----------
  protected buscarCatastro(): void {
    if (this.catastro.invalid) {
      this.catastro.markAllAsTouched();
      return;
    }
    const { codigo, departamentoId } = this.catastro.getRawValue();
    this.estadoCatastro.set('buscando');
    this.resultadoCatastro.set(null);
    this.predios.buscarCatastro(codigo.trim(), departamentoId!).subscribe({
      next: (r) => {
        this.resultadoCatastro.set(r);
        this.estadoCatastro.set('encontrado');
      },
      error: (e) => {
        this.mensajeCatastro.set(mensajeError(e));
        this.estadoCatastro.set(estadoError(e) === 404 ? 'no-encontrado' : 'no-disponible');
      },
    });
  }

  /** T83: confirma el predio encontrado y precarga el formulario. */
  protected async usarCatastro(): Promise<void> {
    const r = this.resultadoCatastro();
    if (!r) {
      return;
    }
    this.formulario.patchValue({
      nombre: this.capitalizar(r.nombre),
      latitud: r.latitud,
      longitud: r.longitud,
      areaHa: r.areaHa !== null ? Math.round(r.areaHa * 100) / 100 : null,
      codigoCatastral: r.codigoCatastral,
    });
    if (r.latitud !== null && r.longitud !== null) {
      this.centroMapa.set([r.latitud, r.longitud]);
      this.zoomMapa.set(15);
    }
    if (r.distritoId) {
      await this.seleccionarUbigeo(r.ubigeo, r.distritoId);
    }
    this.estadoCatastro.set('inicial');
    this.notificaciones.info(t('Cargamos los datos oficiales. Revisa el formulario y completa la fuente de agua.'));
    document.getElementById('predio-nombre')?.focus();
  }

  protected registrarConMapa(): void {
    this.estadoCatastro.set('inicial');
    document.getElementById('predio-nombre')?.focus();
  }

  // ---------- Auxiliares ----------
  private cargarPredio(id: number): void {
    this.cargando.set(true);
    this.predios.obtener(id).subscribe({
      next: async (p) => {
        this.formulario.patchValue({
          nombre: p.nombre,
          latitud: p.latitud,
          longitud: p.longitud,
          altitudMsnm: p.altitudMsnm ?? null,
          areaHa: p.areaHa,
          fuenteAgua: p.fuenteAgua,
          codigoCatastral: p.codigoCatastral ?? '',
        });
        this.centroMapa.set([p.latitud, p.longitud]);
        this.zoomMapa.set(14);
        await this.seleccionarUbigeo(p.ubigeo, p.distritoId);
        this.cargando.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        this.error.set(mensajeError(e));
      },
    });
  }

  /** Selecciona departamento, provincia y distrito a partir del ubigeo del distrito (6 dígitos). */
  private async seleccionarUbigeo(ubigeoDistrito: string, distritoId: number): Promise<void> {
    const c = this.formulario.controls;
    const dep = this.departamentos().find((d) => d.ubigeo === ubigeoDistrito.slice(0, 2));
    if (!dep) {
      return;
    }
    c.departamentoId.setValue(dep.id, { emitEvent: false });
    const provincias = await firstValueFrom(this.ubigeo.provincias(dep.id));
    this.provincias.set(provincias);
    const prov = provincias.find((p) => p.ubigeo === ubigeoDistrito.slice(0, 4));
    if (!prov) {
      return;
    }
    c.provinciaId.setValue(prov.id, { emitEvent: false });
    const distritos = await firstValueFrom(this.ubigeo.distritos(prov.id));
    this.distritos.set(distritos);
    c.distritoId.setValue(distritoId);
  }

  private actualizarPunto(): void {
    const { latitud, longitud } = this.formulario.getRawValue();
    const valido = latitud !== null && longitud !== null
      && this.formulario.controls.latitud.valid && this.formulario.controls.longitud.valid;
    this.punto.set(valido ? [latitud!, longitud!] : null);
  }

  private capitalizar(texto: string | null): string {
    return (texto ?? '').toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase()).slice(0, 80);
  }
}
