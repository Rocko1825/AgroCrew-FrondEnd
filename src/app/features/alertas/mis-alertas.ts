import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mensajeError } from '../../core/interceptors/auth.interceptor';
import { Alerta } from '../../core/models/api.models';
import { AlertaService } from '../../core/services/alerta.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Aviso } from '../../shared/components/aviso';
import { Cargando } from '../../shared/components/cargando';
import { EstadoVacio } from '../../shared/components/estado-vacio';
import { EtiquetaPipe } from '../../shared/pipes/etiqueta.pipe';
import { Icono } from '../../shared/components/icono';
import { TApiPipe, TPipe } from '../../shared/pipes/t.pipe';

type FiltroEstado = 'todas' | 'no-leidas' | 'leidas';

/**
 * Mis alertas (mockup de la figura 13; US15, US16; T89–T91): tarjetas con título, nivel y acciones
 * preventivas, de la más reciente a la más antigua, con filtro por predio. Al abrir una alerta se marca
 * como leída y se actualiza el contador de la cabecera.
 */
@Component({
  selector: 'app-mis-alertas',
  imports: [FormsModule, RouterLink, DatePipe, Aviso, Cargando, EstadoVacio, EtiquetaPipe, Icono, TPipe, TApiPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mis-alertas.html',
  styles: `
    .filtros { margin-bottom: 20px; align-items: flex-end; }
    .filtros .campo { flex: 1 1 220px; }
    .lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
    .alerta { animation: aparecer 0.35s var(--curva) both; }
    .alerta.no-leida { border-left: 4px solid var(--color-acento); }
    .alerta.nivel-borde-ALTO, .alerta.nivel-borde-MUY_ALTO { border-left-color: var(--medidor-baja); }
    .icono-alerta { display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 10px; flex: none; }
    .encabezado { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
    .encabezado h3 { margin: 0; flex: 1 1 220px; }
    .meta { margin: 4px 0 0; font-size: 0.9rem; }
    .cuerpo { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--color-borde); }
    .acciones-sugeridas { margin: 4px 0 12px; padding-left: 20px; }
  `,
})
export class MisAlertas implements OnInit {
  protected readonly servicio = inject(AlertaService);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly alertas = signal<Alerta[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly filtroPredio = signal<number | null>(null);
  protected readonly filtroEstado = signal<FiltroEstado>('todas');
  private readonly abiertas = signal<ReadonlySet<number>>(new Set());

  /** Predios que tienen alertas, para el filtro. */
  protected readonly predios = computed(() => {
    const mapa = new Map<number, string>();
    for (const a of this.alertas() ?? []) {
      mapa.set(a.predioId, a.predio);
    }
    return [...mapa].map(([id, nombre]) => ({ id, nombre }));
  });

  protected readonly visibles = computed(() => (this.alertas() ?? []).filter((a) =>
    (this.filtroPredio() === null || a.predioId === this.filtroPredio())
    && (this.filtroEstado() === 'todas' || (this.filtroEstado() === 'leidas') === a.leida)));

  ngOnInit(): void {
    this.servicio.listar().subscribe({
      next: (l) => this.alertas.set(l),
      error: (e) => this.error.set(mensajeError(e)),
    });
    this.servicio.refrescarContador();
  }

  protected abierta(id: number): boolean {
    return this.abiertas().has(id);
  }

  /** T90: al abrir una alerta sin leer, se marca como leída. */
  protected alternar(alerta: Alerta): void {
    const abrir = !this.abierta(alerta.id);
    this.abiertas.update((s) => {
      const nuevo = new Set(s);
      if (abrir) {
        nuevo.add(alerta.id);
      } else {
        nuevo.delete(alerta.id);
      }
      return nuevo;
    });
    if (abrir && !alerta.leida) {
      this.marcarLeida(alerta);
    }
  }

  protected marcarLeida(alerta: Alerta): void {
    this.servicio.marcarLeida(alerta.id).subscribe({
      next: () => this.alertas.update((l) => (l ?? []).map((a) =>
        a.id === alerta.id ? { ...a, leida: true, fechaLectura: new Date().toISOString() } : a)),
      error: (e) => this.notificaciones.error(mensajeError(e)),
    });
  }

  protected acciones(texto: string | null): string[] {
    return (texto ?? '').split(/[;\n·]+/).map((t) => t.trim()).filter(Boolean);
  }
}
