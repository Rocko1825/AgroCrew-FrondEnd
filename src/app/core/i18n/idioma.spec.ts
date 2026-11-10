import { t } from './idioma';
import { PATRONES_API_EN, TEXTOS_API_EN } from './textos-api.en';
import { TEXTOS_EN } from './textos.en';

/** Traduce como lo haría tApi en inglés, sin depender del idioma guardado en el navegador. */
function traducirApiEnIngles(texto: string): string {
  if (TEXTOS_API_EN[texto]) {
    return TEXTOS_API_EN[texto];
  }
  const patron = PATRONES_API_EN.find(([re]) => re.test(texto));
  return patron ? texto.replace(patron[0], patron[1]) : texto;
}

describe('Traducción (idioma)', () => {
  it('en español devuelve el texto con sus parámetros reemplazados', () => {
    expect(t('Página {n} de {total}', { n: 2, total: 5 })).toBe('Página 2 de 5');
  });

  it('el diccionario de inglés conserva los mismos parámetros que el texto en español', () => {
    for (const [es, en] of Object.entries(TEXTOS_EN)) {
      const parametrosEs = (es.match(/\{\w+\}/g) ?? []).sort();
      const parametrosEn = (en.match(/\{\w+\}/g) ?? []).sort();
      expect(parametrosEn, es).toEqual(parametrosEs);
    }
  });

  it('traduce los mensajes del backend que llevan datos', () => {
    expect(traducirApiEnIngles('La altitud está fuera del rango del cultivo por 450 m'))
      .toBe('The altitude is outside the crop range by 450 m');
    expect(traducirApiEnIngles('1891.2 mm/año')).toBe('1891.2 mm/year');
    expect(traducirApiEnIngles('2500 - 3800 msnm')).toBe('2500 - 3800 m a.s.l.');
    expect(traducirApiEnIngles('Grupo F')).toBe('Group F');
  });

  it('deja sin cambios un texto del backend que no conoce', () => {
    expect(traducirApiEnIngles('Desborde del río Mantaro')).toBe('Desborde del río Mantaro');
  });
});
