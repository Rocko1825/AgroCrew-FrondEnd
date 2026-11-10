import { Injectable, signal } from '@angular/core';

export interface SolicitudConfirmacion {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  peligro?: boolean;
}

interface ConfirmacionPendiente extends SolicitudConfirmacion {
  responder: (aceptado: boolean) => void;
}

/**
 * Diálogo de confirmación reutilizable (T59). Uso:
 *   if (await this.confirmacion.confirmar({ titulo: '¿Eliminar?', mensaje: '...' })) { ... }
 * El diálogo se dibuja una sola vez en el layout (DialogoConfirmacion).
 */
@Injectable({ providedIn: 'root' })
export class ConfirmacionService {
  readonly pendiente = signal<ConfirmacionPendiente | null>(null);

  confirmar(solicitud: SolicitudConfirmacion): Promise<boolean> {
    return new Promise((resolve) => {
      this.pendiente.set({
        ...solicitud,
        responder: (aceptado) => {
          this.pendiente.set(null);
          resolve(aceptado);
        },
      });
    });
  }
}
