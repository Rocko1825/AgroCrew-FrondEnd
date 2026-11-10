import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { t } from '../../../core/i18n/idioma';
import { mensajeError } from '../../../core/interceptors/auth.interceptor';
import { Predio } from '../../../core/models/api.models';
import { AlertaService } from '../../../core/services/alerta.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmacionService } from '../../../core/services/confirmacion.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { PredioService } from '../../../core/services/predio.service';
import { Aviso } from '../../../shared/components/aviso';
import { Cargando } from '../../../shared/components/cargando';
import { Contador } from '../../../shared/components/contador';
import { EstadoVacio } from '../../../shared/components/estado-vacio';
import { Icono } from '../../../shared/components/icono';
import { Mapa, MarcadorMapa } from '../../../shared/components/mapa';
import { EtiquetaPipe } from '../../../shared/pipes/etiqueta.pipe';
import { TPipe } from '../../../shared/pipes/t.pipe';

/** Mis predios (US08, T79) con edición (US09) y eliminación con confirmación (US10, T81). */
@Component({
  selector: 'app-mis-predios',
  imports: [RouterLink, DatePipe, DecimalPipe, Aviso, Cargando, Contador, EstadoVacio, Icono, Mapa, EtiquetaPipe, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mis-predios.html',
  styleUrl: './mis-predios.scss',
})
export class MisPredios implements OnInit {
  private readonly predios = inject(PredioService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly alertas = inject(AlertaService);
  private readonly notificaciones = inject(NotificacionService);
  protected readonly auth = inject(AuthService);

  protected readonly lista = signal<Predio[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly areaTotal = computed(() => (this.lista() ?? []).reduce((s, p) => s + Number(p.areaHa), 0));
  protected readonly evaluados = computed(() => (this.lista() ?? []).filter((p) => p.ultimaEvaluacion).length);
  protected readonly marcadores = computed<MarcadorMapa[]>(() => (this.lista() ?? []).map((p) => ({
    latitud: p.latitud,
    longitud: p.longitud,
    color: '#2F5D3A',
    titulo: p.nombre,
    popup: `${p.nombre}\n${p.distrito}, ${p.provincia}\n${p.areaHa} ha`,
  })));

  ngOnInit(): void {
    this.predios.listar().subscribe({
      next: (l) => this.lista.set(l),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  protected async eliminar(predio: Predio): Promise<void> {
    const aceptado = await this.confirmacion.confirmar({
      titulo: t('¿Eliminar «{nombre}»?', { nombre: predio.nombre }),
      mensaje: t('El predio dejará de aparecer en tu lista y ya no recibirás alertas de él. Sus evaluaciones anteriores se conservan.'),
      textoConfirmar: t('Sí, eliminar'),
      peligro: true,
    });
    if (!aceptado) {
      return; // US10: si se cancela, el predio no cambia.
    }
    this.predios.eliminar(predio.id).subscribe({
      next: () => {
        this.lista.update((l) => (l ?? []).filter((p) => p.id !== predio.id));
        this.alertas.refrescarContador(); // sus alertas dejan de contarse
        this.notificaciones.exito(t('Eliminaste el predio «{nombre}».', { nombre: predio.nombre }));
      },
      error: (e) => this.notificaciones.error(mensajeError(e)),
    });
  }
}
