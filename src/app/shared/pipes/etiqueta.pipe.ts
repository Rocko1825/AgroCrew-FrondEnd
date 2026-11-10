import { Pipe, PipeTransform } from '@angular/core';
import { etiqueta } from '../../core/models/etiquetas';

/** Muestra un valor de la API en lenguaje sencillo: {{ 'MUY_ALTO' | etiqueta }} → "Muy alto". */
@Pipe({ name: 'etiqueta' })
export class EtiquetaPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return etiqueta(valor);
  }
}
