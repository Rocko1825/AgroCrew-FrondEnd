import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { t } from '../../../core/i18n/idioma';
import { mensajeError } from '../../../core/interceptors/auth.interceptor';
import { Rol, Usuario } from '../../../core/models/api.models';
import { etiqueta } from '../../../core/models/etiquetas';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmacionService } from '../../../core/services/confirmacion.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Aviso } from '../../../shared/components/aviso';
import { Cargando } from '../../../shared/components/cargando';
import { TPipe } from '../../../shared/pipes/t.pipe';

/** Gestión de usuarios (US33, T114): listado, activar o desactivar cuentas y cambio de rol. */
@Component({
  selector: 'app-admin-usuarios',
  imports: [FormsModule, DatePipe, Aviso, Cargando, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor pagina">
      <div class="pagina-encabezado">
        <div>
          <h1>{{ 'Usuarios' | t }}</h1>
        </div>
        @if (usuarios()) { <span class="chip">{{ '{n} cuentas' | t: { n: usuarios()!.length } }}</span> }
      </div>
      <div class="campo buscador">
        <label for="buscar-usuario">{{ 'Buscar por nombre o correo' | t }}</label>
        <input id="buscar-usuario" type="search" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)">
      </div>
      @if (error()) {
        <app-aviso tipo="error">{{ error() }}</app-aviso>
      } @else if (!usuarios()) {
        <div class="tarjeta"><app-cargando [lineas]="5" /></div>
      } @else {
        <div class="tabla-contenedor tarjeta sin-relleno">
          <table>
            <caption class="sr-only">{{ 'Usuarios de la plataforma' | t }}</caption>
            <thead>
              <tr><th scope="col">{{ 'Nombre' | t }}</th><th scope="col">{{ 'Correo' | t }}</th><th scope="col">{{ 'Rol' | t }}</th>
                <th scope="col">{{ 'Estado' | t }}</th><th scope="col">{{ 'Registro' | t }}</th>
                <th scope="col"><span class="sr-only">{{ 'Acciones' | t }}</span></th></tr>
            </thead>
            <tbody>
              @for (u of filtrados(); track u.id) {
                <tr>
                  <td>
                    <div class="persona">
                      <span class="avatar" aria-hidden="true">{{ u.nombres.charAt(0) }}{{ u.apellidos.charAt(0) }}</span>
                      <span>{{ u.nombres }} {{ u.apellidos }}@if (u.organizacion) {<br><small class="texto-suave">{{ u.organizacion }}</small>}</span>
                    </div>
                  </td>
                  <td>{{ u.email }}</td>
                  <td>
                    <label class="sr-only" [for]="'rol-' + u.id">{{ 'Rol de {nombre}' | t: { nombre: u.nombres } }}</label>
                    <select #combo [id]="'rol-' + u.id" class="rol" [disabled]="esYo(u)" (change)="cambiarRol(u, combo)">
                      @for (r of roles; track r) { <option [value]="r" [selected]="r === u.rol">{{ etiqueta(r) }}</option> }
                    </select>
                  </td>
                  <td><span class="estado-punto" [class.bien]="u.activo" [class.mal]="!u.activo">{{ (u.activo ? 'Activa' : 'Desactivada') | t }}</span></td>
                  <td>{{ u.fechaRegistro | date: 'dd/MM/yyyy' }}</td>
                  <td>
                    @if (!esYo(u)) {
                      <button class="btn btn-secundario btn-pequeno" type="button" (click)="cambiarEstado(u)">
                        {{ (u.activo ? 'Desactivar' : 'Activar') | t }}
                      </button>
                    } @else { <small class="texto-suave">{{ 'Tu cuenta' | t }}</small> }
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
    .buscador { max-width: 420px; margin-bottom: 16px; }
    .sin-relleno { padding: 0; overflow: hidden; }
    .rol { width: auto; padding: 6px 8px; }
    .persona { display: flex; align-items: center; gap: 10px; }
    .avatar {
      display: inline-grid; place-items: center; flex: none; width: 34px; height: 34px; border-radius: 50%;
      background: var(--color-marca-claro); color: var(--color-acento); font-size: 0.8rem; font-weight: 700;
    }
  `,
})
export class AdminUsuarios implements OnInit {
  private readonly servicio = inject(UsuarioService);
  private readonly auth = inject(AuthService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly roles: Rol[] = ['PRODUCTOR', 'ASESOR', 'ADMIN'];
  protected readonly etiqueta = etiqueta;
  protected readonly usuarios = signal<Usuario[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    return (this.usuarios() ?? []).filter((u) =>
      !q || `${u.nombres} ${u.apellidos} ${u.email}`.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    this.servicio.listarTodos().subscribe({
      next: (l) => this.usuarios.set(l),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  protected esYo(u: Usuario): boolean {
    return u.id === this.auth.usuario()?.id;
  }

  protected async cambiarRol(u: Usuario, combo: HTMLSelectElement): Promise<void> {
    const rol = combo.value as Rol;
    const aceptado = await this.confirmacion.confirmar({
      titulo: t('¿Cambiar el rol?'),
      mensaje: t('{nombre} pasará a ser {rol}. Verá su nuevo panel en su siguiente inicio de sesión.',
        { nombre: `${u.nombres} ${u.apellidos}`, rol: etiqueta(rol).toLowerCase() }),
      textoConfirmar: t('Cambiar rol'),
    });
    if (!aceptado) {
      combo.value = u.rol; // si se cancela, el combo vuelve al rol anterior
      return;
    }
    this.servicio.cambiarRol(u.id, rol).subscribe({
      next: (actualizado) => {
        this.reemplazar(actualizado);
        this.notificaciones.exito(t('Rol actualizado: {rol}.', { rol: etiqueta(rol) }));
      },
      error: (e) => {
        combo.value = u.rol;
        this.notificaciones.error(mensajeError(e));
      },
    });
  }

  protected async cambiarEstado(u: Usuario): Promise<void> {
    const activar = !u.activo;
    const aceptado = await this.confirmacion.confirmar({
      titulo: t(activar ? '¿Activar la cuenta?' : '¿Desactivar la cuenta?'),
      mensaje: activar
        ? t('{nombre} podrá volver a iniciar sesión.', { nombre: u.nombres })
        : t('{nombre} ya no podrá iniciar sesión. Sus datos se conservan.', { nombre: u.nombres }),
      textoConfirmar: t(activar ? 'Activar' : 'Desactivar'),
      peligro: !activar,
    });
    if (!aceptado) {
      return;
    }
    this.servicio.cambiarEstado(u.id, activar).subscribe({
      next: (actualizado) => {
        this.reemplazar(actualizado);
        this.notificaciones.exito(t(activar ? 'Cuenta activada.' : 'Cuenta desactivada.'));
      },
      error: (e) => this.notificaciones.error(mensajeError(e)),
    });
  }

  private reemplazar(u: Usuario): void {
    this.usuarios.update((l) => (l ?? []).map((x) => (x.id === u.id ? u : x)));
  }
}
