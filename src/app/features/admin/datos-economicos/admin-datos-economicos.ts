import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { t } from '../../../core/i18n/idioma';
import { mensajeError } from '../../../core/interceptors/auth.interceptor';
import { Cultivo, DatoEconomico, DatoEconomicoSolicitud, ErrorApi, Ubigeo } from '../../../core/models/api.models';
import { CultivoService } from '../../../core/services/cultivo.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { UbigeoService } from '../../../core/services/ubigeo.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Aviso } from '../../../shared/components/aviso';
import { Boton } from '../../../shared/components/boton';
import { Cargando } from '../../../shared/components/cargando';
import { Icono } from '../../../shared/components/icono';
import { TPipe } from '../../../shared/pipes/t.pipe';
import { aplicarErroresServidor, errorDe } from '../../../shared/utils/formularios';

/**
 * Datos económicos referenciales (US32, T113): precio en chacra, rendimiento y costo por cultivo, región
 * y periodo. Si ya existe un dato del mismo periodo (409), se ofrece actualizar el registro existente.
 */
@Component({
  selector: 'app-admin-datos-economicos',
  imports: [FormsModule, ReactiveFormsModule, CurrencyPipe, DecimalPipe, Aviso, Boton, Cargando, Icono, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-datos-economicos.html',
  styles: `
    .filtros { align-items: flex-end; margin-bottom: 16px; }
    .filtros .campo { flex: 1 1 220px; }
    .sin-relleno { padding: 0; overflow: hidden; }
    .editando { border-left: 4px solid var(--medidor-media); }
    .num { text-align: right; white-space: nowrap; }
  `,
})
export class AdminDatosEconomicos implements OnInit {
  private readonly usuarios = inject(UsuarioService);
  private readonly catalogo = inject(CultivoService);
  private readonly ubigeo = inject(UbigeoService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly errorDe = errorDe;
  protected readonly cultivos = signal<Cultivo[]>([]);
  protected readonly regiones = signal<Ubigeo[]>([]);
  protected readonly datos = signal<DatoEconomico[] | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly filtroCultivo = signal<number | null>(null);
  protected readonly filtroRegion = signal<number | null>(null);

  protected readonly editandoId = signal<number | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorFormulario = signal<string | null>(null);
  protected readonly duplicado = signal(false);

  protected readonly formulario = this.fb.group({
    cultivoId: this.fb.control<number | null>(null, Validators.required),
    departamentoId: this.fb.control<number | null>(null, Validators.required),
    precioChacraKg: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    rendimientoKgHa: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    costoProduccionHa: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    fuente: ['', [Validators.required, Validators.maxLength(150)]],
    periodo: [String(new Date().getFullYear() - 1),
      [Validators.required, Validators.pattern(/^\d{4}(-(0[1-9]|1[0-2]))?$/)]],
  });

  ngOnInit(): void {
    this.catalogo.listarTodos().subscribe((l) => this.cultivos.set([...l].sort((a, b) => a.nombre.localeCompare(b.nombre))));
    this.ubigeo.departamentos().subscribe((l) => this.regiones.set(l));
    this.buscar();
  }

  protected buscar(): void {
    this.datos.set(null);
    this.usuarios.listarDatosEconomicos(this.filtroCultivo(), this.filtroRegion()).subscribe({
      next: (l) => this.datos.set(l),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  protected editar(d: DatoEconomico): void {
    this.editandoId.set(d.id);
    this.duplicado.set(false);
    this.errorFormulario.set(null);
    this.formulario.reset({
      cultivoId: d.cultivoId, departamentoId: d.departamentoId, precioChacraKg: d.precioChacraKg,
      rendimientoKgHa: d.rendimientoKgHa, costoProduccionHa: d.costoProduccionHa, fuente: d.fuente, periodo: d.periodo,
    });
    document.getElementById('dato-cultivo')?.focus();
  }

  protected nuevo(): void {
    this.editandoId.set(null);
    this.duplicado.set(false);
    this.errorFormulario.set(null);
    this.formulario.reset();
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();
    const datos: DatoEconomicoSolicitud = {
      cultivoId: v.cultivoId!, departamentoId: v.departamentoId!, precioChacraKg: v.precioChacraKg!,
      rendimientoKgHa: v.rendimientoKgHa!, costoProduccionHa: v.costoProduccionHa!, fuente: v.fuente.trim(), periodo: v.periodo,
    };
    const id = this.editandoId();
    this.guardando.set(true);
    this.errorFormulario.set(null);
    this.duplicado.set(false);
    const peticion = id ? this.usuarios.actualizarDatoEconomico(id, datos) : this.usuarios.registrarDatoEconomico(datos);
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.notificaciones.exito(t(id ? 'Dato económico actualizado.' : 'Dato económico registrado.'));
        this.nuevo();
        this.buscar();
      },
      error: (e: ErrorApi) => {
        this.guardando.set(false);
        this.duplicado.set(e.estado === 409);
        aplicarErroresServidor(this.formulario, e.detalles);
        this.errorFormulario.set(mensajeError(e));
      },
    });
  }

  /** US32, escenario 2: carga el registro existente del mismo cultivo, región y periodo para actualizarlo. */
  protected editarExistente(): void {
    const v = this.formulario.getRawValue();
    this.usuarios.listarDatosEconomicos(v.cultivoId, v.departamentoId).subscribe((l) => {
      const existente = l.find((d) => d.periodo === v.periodo);
      if (existente) {
        // Se conservan las cifras nuevas que escribió el administrador; solo se pasa a modo edición.
        this.editandoId.set(existente.id);
        this.duplicado.set(false);
        this.errorFormulario.set(null);
        this.notificaciones.info(t('Ahora estás editando el registro existente. Revisa las cifras y guarda.'));
      }
    });
  }
}
