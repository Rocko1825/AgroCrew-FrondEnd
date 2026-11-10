import { effect, Injectable, signal } from '@angular/core';

export type Tema = 'claro' | 'oscuro';

const CLAVE = 'agrocrew.tema';

/**
 * Modo claro u oscuro. La primera vez sigue la preferencia del sistema; luego recuerda la elección.
 * El tema se aplica con el atributo data-theme en <html> (los colores están en variables CSS).
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  readonly tema = signal<Tema>(this.leer());

  constructor() {
    effect(() => {
      const tema = this.tema();
      document.documentElement.dataset['theme'] = tema === 'oscuro' ? 'dark' : 'light';
      try {
        localStorage.setItem(CLAVE, tema);
      } catch {
        // Sin almacenamiento: el tema dura mientras la pestaña esté abierta.
      }
    });
  }

  alternar(): void {
    this.tema.update((t) => (t === 'oscuro' ? 'claro' : 'oscuro'));
  }

  private leer(): Tema {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado === 'claro' || guardado === 'oscuro') {
        return guardado;
      }
    } catch {
      // Se usa la preferencia del sistema.
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  }
}
