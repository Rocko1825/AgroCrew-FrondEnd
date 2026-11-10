import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';
import { TemaService } from './core/services/tema.service';
import { Cabecera } from './layout/cabecera';
import { Pie } from './layout/pie';
import { DialogoConfirmacion } from './shared/components/dialogo-confirmacion';
import { TPipe } from './shared/pipes/t.pipe';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Cabecera, Pie, DialogoConfirmacion, NgxSonnerToaster, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="saltar" href="#contenido">{{ 'Saltar al contenido' | t }}</a>
    <app-cabecera />
    <main id="contenido" tabindex="-1">
      <router-outlet />
    </main>
    <app-pie />
    <ngx-sonner-toaster position="bottom-right" [theme]="temaToaster()" richColors closeButton [duration]="5000" />
    <app-dialogo-confirmacion />
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    main { flex: 1; outline: none; }
    .saltar { position: absolute; left: -9999px; top: 8px; z-index: 3000; background: var(--color-superficie); padding: 8px 12px; }
    .saltar:focus { left: 8px; }
  `,
})
export class App {
  private readonly tema = inject(TemaService);
  /** Las notificaciones siguen el modo claro u oscuro de la app. */
  protected readonly temaToaster = computed(() => (this.tema.tema() === 'oscuro' ? 'dark' : 'light'));
}
