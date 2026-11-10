import { TEXTOS_API_EN, PATRONES_API_EN } from './textos-api.en';
import { TEXTOS_EN } from './textos.en';

/**
 * Idioma de la interfaz (español por defecto, o inglés).
 *
 * Los textos se escriben en español directamente en las plantillas y se traducen con el pipe `t`:
 *   {{ 'Mis predios' | t }}            → "My plots" en inglés
 *   {{ 'Tienes {n} alertas' | t: { n: 3 } }}
 * Si falta una traducción, se muestra el texto en español (nunca una clave vacía).
 *
 * El idioma se elige al cargar la aplicación: al cambiarlo se guarda y se recarga la página, así las fechas
 * y los números también cambian de formato (LOCALE_ID).
 */
export type Idioma = 'es' | 'en';

const CLAVE = 'agrocrew.idioma';

function leerIdioma(): Idioma {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === 'es' || guardado === 'en') {
      return guardado;
    }
  } catch {
    // Sin almacenamiento disponible: se usa español.
  }
  return 'es';
}

export const IDIOMA: Idioma = leerIdioma();

/** LOCALE_ID de Angular según el idioma (fechas, números y montos). */
export const LOCALE = IDIOMA === 'en' ? 'en-US' : 'es-PE';

export function cambiarIdioma(idioma: Idioma): void {
  try {
    localStorage.setItem(CLAVE, idioma);
  } catch {
    // Sin almacenamiento: el cambio dura solo hasta recargar.
  }
  location.reload();
}

type Parametros = Record<string, string | number | null | undefined>;

/** Traduce un texto de la interfaz escrito en español. */
export function t(texto: string, parametros?: Parametros): string {
  const traducido = IDIOMA === 'en' ? (TEXTOS_EN[texto] ?? texto) : texto;
  return reemplazar(traducido, parametros);
}

/**
 * Traduce un texto que viene del backend (mensajes de error, validaciones, suelo, factores…).
 * Usa coincidencias exactas y, para los mensajes que llevan datos, patrones.
 */
export function tApi(texto: string | null | undefined): string {
  if (!texto) {
    return '';
  }
  if (IDIOMA !== 'en') {
    return texto;
  }
  const exacto = TEXTOS_API_EN[texto.trim()];
  if (exacto) {
    return exacto;
  }
  for (const [patron, reemplazo] of PATRONES_API_EN) {
    if (patron.test(texto)) {
      return texto.replace(patron, reemplazo);
    }
  }
  return texto;
}

function reemplazar(texto: string, parametros?: Parametros): string {
  if (!parametros) {
    return texto;
  }
  return texto.replace(/\{(\w+)\}/g, (_, clave: string) => String(parametros[clave] ?? ''));
}
