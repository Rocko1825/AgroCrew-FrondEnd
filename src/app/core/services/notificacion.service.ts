import { Injectable } from '@angular/core';
import { toast } from 'ngx-sonner';

/**
 * Mensajes breves de confirmación o error. Usa ngx-sonner (port para Angular de Sonner, de Emil Kowalski):
 * se apilan, se expanden al pasar el cursor y se descartan deslizándolos.
 * Las pantallas solo llaman a exito / error / info, así se puede cambiar la librería sin tocarlas.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  exito(texto: string): void {
    toast.success(texto);
  }

  error(texto: string): void {
    toast.error(texto, { duration: 8000 });
  }

  info(texto: string): void {
    toast.info(texto);
  }
}
