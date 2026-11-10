import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { EstadoVacio } from '../shared/components/estado-vacio';
import { TPipe } from '../shared/pipes/t.pipe';

@Component({
  selector: 'app-no-encontrado',
  imports: [RouterLink, EstadoVacio, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor pagina angosto">
      <app-estado-vacio icono="mapa" [titulo]="'No encontramos esta página' | t"
                        [mensaje]="'Puede que el enlace esté mal escrito o que la página ya no exista.' | t">
        <a class="btn" [routerLink]="auth.autenticado() ? auth.rutaInicio() : '/acceso'">{{ 'Volver al inicio' | t }}</a>
      </app-estado-vacio>
    </div>
  `,
})
export class NoEncontrado {
  protected readonly auth = inject(AuthService);
}
