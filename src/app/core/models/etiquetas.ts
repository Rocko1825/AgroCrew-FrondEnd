import { IDIOMA } from '../i18n/idioma';

/**
 * Textos en lenguaje sencillo para los valores de la API (tono cercano de la guía de estilo),
 * en español e inglés.
 */
const ETIQUETAS_ES: Record<string, string> = {
  PRODUCTOR: 'Productor', ASESOR: 'Asesor', ADMIN: 'Administrador',
  SECANO: 'Secano (solo lluvia)', RIEGO_GRAVEDAD: 'Riego por gravedad', RIEGO_TECNIFICADO: 'Riego tecnificado',
  BAJO: 'Bajo', MEDIO: 'Medio', ALTO: 'Alto', MUY_ALTO: 'Muy alto',
  ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja',
  FAVORABLE: 'Favorable', NEUTRO: 'Neutro', LIMITANTE: 'Limitante',
  SUELO: 'Suelo', ALTITUD: 'Altitud', TEMPERATURA: 'Temperatura', AGUA: 'Agua (lluvia o riego)', RIESGO_HIDRICO: 'Riesgo hídrico',
  COMPLETADA: 'Completada', PARCIAL: 'Parcial', GENERAL: 'Ranking general', CULTIVO_ESPECIFICO: 'Cultivo específico',
  LLUVIA_INTENSA: 'Lluvia intensa',
  TRANSITORIO: 'Transitorio', PERMANENTE: 'Permanente', PASTO: 'Pasto', FORESTAL: 'Forestal',
  MIDAGRI: 'suelo (MIDAGRI)', ANA: 'riesgo hídrico (ANA)', OPEN_METEO: 'clima (Open-Meteo)', IA: 'explicación con IA',
};

const ETIQUETAS_EN: Record<string, string> = {
  PRODUCTOR: 'Farmer', ASESOR: 'Advisor', ADMIN: 'Administrator',
  SECANO: 'Rain-fed (rain only)', RIEGO_GRAVEDAD: 'Gravity irrigation', RIEGO_TECNIFICADO: 'Drip or sprinkler irrigation',
  BAJO: 'Low', MEDIO: 'Medium', ALTO: 'High', MUY_ALTO: 'Very high',
  ALTA: 'High', MEDIA: 'Medium', BAJA: 'Low',
  FAVORABLE: 'Favorable', NEUTRO: 'Neutral', LIMITANTE: 'Limiting',
  SUELO: 'Soil', ALTITUD: 'Altitude', TEMPERATURA: 'Temperature', AGUA: 'Water (rain or irrigation)', RIESGO_HIDRICO: 'Water risk',
  COMPLETADA: 'Completed', PARCIAL: 'Partial', GENERAL: 'General ranking', CULTIVO_ESPECIFICO: 'Specific crop',
  LLUVIA_INTENSA: 'Heavy rain',
  TRANSITORIO: 'Seasonal', PERMANENTE: 'Permanent', PASTO: 'Pasture', FORESTAL: 'Forestry',
  MIDAGRI: 'soil (MIDAGRI)', ANA: 'water risk (ANA)', OPEN_METEO: 'climate (Open-Meteo)', IA: 'AI explanation',
};

const ETIQUETAS = IDIOMA === 'en' ? ETIQUETAS_EN : ETIQUETAS_ES;

export function etiqueta(valor: string | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') {
    return '—';
  }
  return ETIQUETAS[valor] ?? valor;
}

export const MESES = IDIOMA === 'en'
  ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
