import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TPipe } from '../pipes/t.pipe';

/** Paginador simple para las listas paginadas del backend (página empieza en 0). */
@Component({
  selector: 'app-paginador',
  imports: [TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPaginas() > 1) {
      <nav class="fila" [attr.aria-label]="'Paginación' | t">
        <button class="btn btn-secundario btn-pequeno" type="button" [disabled]="pagina() === 0"
                (click)="cambiar.emit(pagina() - 1)">{{ 'Anterior' | t }}</button>
        <span>{{ 'Página {n} de {total}' | t: { n: pagina() + 1, total: totalPaginas() } }}</span>
        <button class="btn btn-secundario btn-pequeno" type="button" [disabled]="pagina() + 1 >= totalPaginas()"
                (click)="cambiar.emit(pagina() + 1)">{{ 'Siguiente' | t }}</button>
      </nav>
    }
  `,
  styles: `:host { display: block; margin-top: 16px; }`,
})
export class Paginador {
  readonly pagina = input.required<number>();
  readonly totalPaginas = input.required<number>();
  readonly cambiar = output<number>();
}
