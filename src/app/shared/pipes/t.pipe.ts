import { Pipe, PipeTransform } from '@angular/core';
import { t, tApi } from '../../core/i18n/idioma';

/** Traduce un texto de la interfaz: {{ 'Mis predios' | t }} o {{ 'Hola {n}' | t: { n: nombre } }}. */
@Pipe({ name: 't' })
export class TPipe implements PipeTransform {
  transform(texto: string, parametros?: Record<string, string | number | null | undefined>): string {
    return t(texto, parametros);
  }
}

/** Traduce un texto que viene del backend (mensajes, suelo, factores…): {{ suelo.mensaje | tApi }}. */
@Pipe({ name: 'tApi' })
export class TApiPipe implements PipeTransform {
  transform(texto: string | null | undefined): string {
    return tApi(texto);
  }
}
