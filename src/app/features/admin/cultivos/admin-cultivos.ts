import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { t } from '../../../core/i18n/idioma';
import { mensajeError } from '../../../core/interceptors/auth.interceptor';
import { Cultivo } from '../../../core/models/api.models';
import { ConfirmacionService } from '../../../core/services/confirmacion.service';
import { CultivoService } from '../../../core/services/cultivo.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { Aviso } from '../../../shared/components/aviso';
import { Cargando } from '../../../shared/components/cargando';
import { Icono } from '../../../shared/components/icono';
import { EtiquetaPipe } from '../../../shared/pipes/etiqueta.pipe';
import { TPipe } from '../../../shared/pipes/t.pipe';

/** Catálogo de cultivos (US30, T110): incluye los desactivados, con activar y desactivar. */
@Component({
  selector: 'app-admin-cultivos',
  imports: [FormsModule, RouterLink, Aviso, Cargando, Icono, EtiquetaPipe, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor pagina">
      <div class="pagina-encabezado">
        <div>
          <h1>{{ 'Catálogo de cultivos' | t }}</h1>
        </div>
        <a class="btn" routerLink="/admin/cultivos/nuevo"><app-icono nombre="mas" [tamano]="18" /> {{ 'Registrar cultivo' | t }}</a>
      </div>
      <div class="fila filtros">
        <div class="campo">
          <label for="buscar-cultivo">{{ 'Buscar' | t }}</label>
          <input id="buscar-cultivo" type="search" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)">
        </div>
        <label class="solo-activos"><input type="checkbox" [ngModel]="soloActivos()" (ngModelChange)="soloActivos.set($event)"> {{ 'Solo activos' | t }}</label>
      </div>
      @if (error()) {
        <app-aviso tipo="error">{{ error() }}</app-aviso>
      } @else if (!cultivos()) {
        <div class="tarjeta"><app-cargando [lineas]="6" /></div>
      } @else {
        <div class="tabla-contenedor tarjeta sin-relleno">
          <table>
            <caption class="sr-only">{{ 'Cultivos del catálogo' | t }}</caption>
            <thead>
              <tr><th scope="col">{{ 'Cultivo' | t }}</th><th scope="col">{{ 'Tipo' | t }}</th><th scope="col">{{ 'Altitud (msnm)' | t }}</th>
                <th scope="col">{{ 'Temperatura (°C)' | t }}</th><th scope="col">{{ 'Suelos aptos' | t }}</th><th scope="col">{{ 'Estado' | t }}</th>
                <th scope="col"><span class="sr-only">{{ 'Acciones' | t }}</span></th></tr>
            </thead>
            <tbody>
              @for (c of filtrados(); track c.id) {
                <tr [class.inactivo]="!c.activo">
                  <td><strong>{{ c.nombre }}</strong>@if (c.nombreCientifico) {<br><small class="texto-suave"><i>{{ c.nombreCientifico }}</i></small>}</td>
                  <td>{{ c.tipo | etiqueta }}</td>
                  <td>{{ c.requerimiento.altitudMin }}–{{ c.requerimiento.altitudMax }}</td>
                  <td>{{ c.requerimiento.temperaturaMin }}–{{ c.requerimiento.temperaturaMax }}</td>
                  <td>
                    @for (g of c.gruposCum; track g) { <span class="grupo">{{ g }}</span> } @empty { — }
                  </td>
                  <td><span class="estado-punto" [class.bien]="c.activo" [class.mal]="!c.activo">{{ (c.activo ? 'Activo' : 'Desactivado') | t }}</span></td>
                  <td class="acciones">
                    <a class="btn btn-secundario btn-pequeno" [routerLink]="['/admin/cultivos', c.id]"><app-icono nombre="lapiz" [tamano]="14" /> {{ 'Editar' | t }}</a>
                    <button class="btn-texto" type="button" (click)="cambiarEstado(c)">{{ (c.activo ? 'Desactivar' : 'Activar') | t }}</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: `
    .filtros { margin-bottom: 16px; align-items: flex-end; }
    .filtros .campo { flex: 0 1 360px; }
    .solo-activos { display: inline-flex; gap: 6px; align-items: center; padding-bottom: 10px; cursor: pointer; }
    .sin-relleno { padding: 0; overflow: hidden; }
    .acciones { white-space: nowrap; }
    .acciones .btn-texto { margin-left: 12px; }
    .inactivo td { opacity: 0.6; }
    .grupo {
      display: inline-grid; place-items: center; width: 1.5rem; height: 1.5rem; margin-right: 4px; border-radius: 50%;
      background: var(--color-marca-claro); color: var(--color-acento); font-size: 0.75rem; font-weight: 700;
    }
  `,
})
export class AdminCultivos implements OnInit {
  private readonly servicio = inject(CultivoService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly cultivos = signal<Cultivo[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly soloActivos = signal(false);
  protected readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    return (this.cultivos() ?? [])
      .filter((c) => (!this.soloActivos() || c.activo) && (!q || c.nombre.toLowerCase().includes(q)))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  ngOnInit(): void {
    this.servicio.listarTodos().subscribe({
      next: (l) => this.cultivos.set(l),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  protected async cambiarEstado(c: Cultivo): Promise<void> {
    const activar = !c.activo;
    const aceptado = await this.confirmacion.confirmar({
      titulo: t(activar ? '¿Activar {cultivo}?' : '¿Desactivar {cultivo}?', { cultivo: c.nombre }),
      mensaje: activar
        ? t('Volverá a considerarse en las nuevas evaluaciones.')
        : t('Dejará de recomendarse en las nuevas evaluaciones. Las evaluaciones anteriores no cambian.'),
      textoConfirmar: t(activar ? 'Activar' : 'Desactivar'),
      peligro: !activar,
    });
    if (!aceptado) {
      return;
    }
    this.servicio.cambiarEstado(c.id, activar).subscribe({
      next: () => {
        this.cultivos.update((l) => (l ?? []).map((x) => (x.id === c.id ? { ...x, activo: activar } : x)));
        this.notificaciones.exito(t(activar ? '{cultivo} activado.' : '{cultivo} desactivado.', { cultivo: c.nombre }));
      },
      error: (e) => this.notificaciones.error(mensajeError(e)),
    });
  }
}
