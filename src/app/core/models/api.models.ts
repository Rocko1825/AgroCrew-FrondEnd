/**
 * Tipos de la API REST de AgroCrew (espejo de los DTO del backend en pe.edu.upc.agrocrew.dto).
 */

export type Rol = 'PRODUCTOR' | 'ASESOR' | 'ADMIN';
export type FuenteAgua = 'SECANO' | 'RIEGO_GRAVEDAD' | 'RIEGO_TECNIFICADO';
export type NivelRiesgo = 'BAJO' | 'MEDIO' | 'ALTO' | 'MUY_ALTO';
export type Compatibilidad = 'ALTA' | 'MEDIA' | 'BAJA';
export type EfectoFactor = 'FAVORABLE' | 'NEUTRO' | 'LIMITANTE';
export type TipoFactor = 'SUELO' | 'ALTITUD' | 'TEMPERATURA' | 'AGUA' | 'RIESGO_HIDRICO';
export type EstadoEvaluacion = 'COMPLETADA' | 'PARCIAL';
export type TipoEvaluacion = 'GENERAL' | 'CULTIVO_ESPECIFICO';
export type TipoAlerta = 'RIESGO_HIDRICO' | 'LLUVIA_INTENSA';
export type TipoCultivo = 'TRANSITORIO' | 'PERMANENTE' | 'PASTO' | 'FORESTAL';
export type ToleranciaInundacion = 'BAJA' | 'MEDIA' | 'ALTA';

/** Formato único de error del backend (GlobalExceptionHandler). */
export interface ErrorApi {
  fecha?: string;
  estado: number;
  error?: string;
  mensaje: string;
  ruta?: string;
  detalles?: Record<string, string>;
}

export interface Mensaje {
  mensaje: string;
}

/** Página de Spring Data (serialización VIA_DTO). */
export interface Pagina<T> {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
}

// ---------- Autenticación y usuarios ----------
export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string | null;
  organizacion?: string | null;
  rol: Rol;
  activo: boolean;
  fechaRegistro: string;
}

export interface AuthRespuesta {
  token: string;
  tipo: string;
  expiraEnMs: number;
  usuario: Usuario;
}

export interface RegistroSolicitud {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  telefono?: string | null;
  organizacion?: string | null;
  tipoUsuario: 'PRODUCTOR' | 'ASESOR';
}

export interface PerfilSolicitud {
  nombres: string;
  apellidos: string;
  telefono?: string | null;
  organizacion?: string | null;
}

// ---------- Ubigeo ----------
export interface Ubigeo {
  id: number;
  ubigeo: string;
  nombre: string;
}

// ---------- Predios ----------
export interface Predio {
  id: number;
  nombre: string;
  codigoCatastral?: string | null;
  latitud: number;
  longitud: number;
  altitudMsnm?: number | null;
  areaHa: number;
  fuenteAgua: FuenteAgua;
  distritoId: number;
  ubigeo: string;
  distrito: string;
  provincia: string;
  departamento: string;
  fechaRegistro: string;
  fechaActualizacion?: string | null;
  ultimaEvaluacion?: string | null;
}

export interface PredioSolicitud {
  nombre: string;
  distritoId: number;
  latitud: number;
  longitud: number;
  altitudMsnm?: number | null;
  areaHa: number;
  fuenteAgua: FuenteAgua;
  codigoCatastral?: string | null;
}

export interface Catastro {
  codigoCatastral: string;
  nombre: string;
  departamento: string;
  provincia: string;
  distrito: string;
  ubigeo: string;
  distritoId: number | null;
  latitud: number | null;
  longitud: number | null;
  areaHa: number | null;
  fuente: string;
}

// ---------- Suelo, clima y riesgo ----------
export interface GrupoCum {
  codigo: string;
  nombre: string;
  descripcionSimple: string;
  usosRecomendados: string;
  usosNoRecomendados: string;
}

export interface Suelo {
  predioId: number;
  disponible: boolean;
  codigoCumOriginal?: string | null;
  grupo?: GrupoCum | null;
  calidadAgrologica?: string | null;
  limitaciones?: string | null;
  mensaje: string;
  fuente: string;
}

export interface DiaPronostico {
  fecha: string;
  temperaturaMax: number | null;
  temperaturaMin: number | null;
  precipitacionMm: number | null;
}

export interface Clima {
  predioId: number;
  temperaturaMedia: number | null;
  precipitacionAnualMm: number | null;
  pronostico: DiaPronostico[];
  fechaConsulta: string;
  datosGuardados: boolean;
  fuente: string;
}

export interface PuntoCritico {
  id: number;
  codigoAna: string;
  descripcion: string;
  tipoPeligro: string | null;
  nivelRiesgo: NivelRiesgo;
  latitud: number;
  longitud: number;
  ubicacion?: string | null;
  distanciaKm?: number | null;
}

export interface Riesgo {
  predioId: number;
  nivelRiesgo: NivelRiesgo;
  radioKm: number;
  puntoMasCercano: PuntoCritico | null;
  puntosCercanos: PuntoCritico[];
  mensaje: string;
}

// ---------- Catálogo ----------
export interface RequerimientoCultivo {
  altitudMin: number;
  altitudMax: number;
  temperaturaMin: number;
  temperaturaMax: number;
  precipitacionMinMm: number;
  precipitacionMaxMm: number;
  toleranciaInundacion: ToleranciaInundacion;
  requiereRiego: boolean;
}

export interface Cultivo {
  id: number;
  nombre: string;
  nombreCientifico?: string | null;
  tipo: TipoCultivo;
  cicloDias?: number | null;
  descripcion?: string | null;
  activo: boolean;
  gruposCum: string[];
  requerimiento: RequerimientoCultivo;
}

export interface CultivoSolicitud {
  nombre: string;
  nombreCientifico?: string | null;
  tipo: TipoCultivo;
  cicloDias?: number | null;
  descripcion?: string | null;
  gruposCum: string[];
  requerimiento: RequerimientoCultivo;
}

// ---------- Evaluaciones ----------
export interface Factor {
  factor: TipoFactor;
  valorPredio: string | null;
  valorRequerido: string | null;
  efecto: EfectoFactor;
  aporte: number;
  aporteMaximo: number;
  detalle: string;
}

export interface Recomendacion {
  posicion: number | null;
  cultivoId: number;
  cultivo: string;
  tipo: TipoCultivo;
  puntaje: number;
  compatibilidad: Compatibilidad;
  factores: Factor[];
}

export interface Evaluacion {
  id: number;
  predioId: number;
  predio: string;
  fecha: string;
  tipo: TipoEvaluacion;
  estado: EstadoEvaluacion;
  grupoCum: string | null;
  grupoCumNombre: string | null;
  cumCodigoOriginal: string | null;
  calidadAgrologica: string | null;
  limitacionesSuelo: string | null;
  altitudMsnm: number | null;
  temperaturaMedia: number | null;
  precipitacionAnualMm: number | null;
  fuenteAgua: FuenteAgua;
  nivelRiesgoHidrico: NivelRiesgo | null;
  distanciaPuntoCriticoKm: number | null;
  fuentesFaltantes: string[];
  explicacion: string;
  explicacionPorIa: boolean;
  modeloIa: string | null;
  aviso: string;
  ranking: Recomendacion[];
  resultadoCultivoConsultado: Recomendacion | null;
}

export interface EvaluacionResumen {
  id: number;
  fecha: string;
  tipo: TipoEvaluacion;
  estado: EstadoEvaluacion;
  mejorCultivo: string | null;
  mejorPuntaje: number | null;
  cultivosCompatibles: number;
}

export interface Calificacion {
  evaluacionId: number;
  puntaje: number;
  comentario: string | null;
  fecha: string;
  fechaActualizacion: string | null;
  actualizada: boolean;
  mensaje: string | null;
}

export interface Rentabilidad {
  predioId: number;
  cultivoId: number;
  cultivo: string;
  region: string;
  disponible: boolean;
  ingresoHa: number | null;
  costoHa: number | null;
  margenHa: number | null;
  precioChacraKg: number | null;
  rendimientoKgHa: number | null;
  moneda: string;
  fuente: string | null;
  periodo: string | null;
  mensaje: string;
  aviso: string;
}

// ---------- Alertas ----------
export interface Alerta {
  id: number;
  predioId: number;
  predio: string;
  tipo: TipoAlerta;
  nivel: NivelRiesgo;
  titulo: string;
  mensaje: string;
  accionesSugeridas: string | null;
  fechaGeneracion: string;
  leida: boolean;
  fechaLectura: string | null;
}

// ---------- Reportes ----------
export interface Indicadores {
  productores: number;
  asesores: number;
  prediosActivos: number;
  evaluaciones: number;
  porcentajeEvaluacionesCompletadas: number;
  porcentajeEvaluacionesPreventivas: number;
  alertasGeneradas: number;
  alertasNoLeidas: number;
  puntosCriticos: number;
  cultivosActivos: number;
  calificaciones: number;
  porcentajeCalificacionesUtiles: number;
}

export interface ReporteConteo {
  etiqueta: string;
  cantidad: number;
}

export interface ReporteCultivo {
  cultivo: string;
  vecesRecomendado: number;
  puntajePromedio: number | null;
}

export interface ReporteNivelRiesgo {
  departamento: string;
  nivelRiesgo: NivelRiesgo | null;
  cantidad: number;
}

export interface ReporteMensual {
  mes: number;
  tipo: TipoAlerta;
  cantidad: number;
}

// ---------- Administración ----------
export interface DatoEconomico {
  id: number;
  cultivoId: number;
  cultivo: string;
  departamentoId: number;
  region: string;
  precioChacraKg: number;
  rendimientoKgHa: number;
  costoProduccionHa: number;
  fuente: string;
  periodo: string;
  fechaRegistro: string;
  fechaActualizacion: string | null;
}

export interface DatoEconomicoSolicitud {
  cultivoId: number;
  departamentoId: number;
  precioChacraKg: number;
  rendimientoKgHa: number;
  costoProduccionHa: number;
  fuente: string;
  periodo: string;
}
