/**
 * Coordenadas aproximadas de la capital de cada departamento (INEI), para centrar el mapa de calor
 * cuando se filtra por zona. La API no expone las coordenadas del departamento.
 */
export const CENTRO_DEPARTAMENTO: Record<string, [number, number]> = {
  AMAZONAS: [-6.23, -77.87],
  ANCASH: [-9.53, -77.53],
  APURIMAC: [-13.64, -72.88],
  AREQUIPA: [-16.4, -71.54],
  AYACUCHO: [-13.16, -74.22],
  CAJAMARCA: [-7.16, -78.51],
  CALLAO: [-12.05, -77.12],
  CUSCO: [-13.53, -71.97],
  HUANCAVELICA: [-12.79, -74.97],
  HUANUCO: [-9.93, -76.24],
  ICA: [-14.07, -75.73],
  JUNIN: [-12.07, -75.21],
  'LA LIBERTAD': [-8.11, -79.03],
  LAMBAYEQUE: [-6.77, -79.84],
  LIMA: [-12.05, -77.04],
  LORETO: [-3.75, -73.25],
  'MADRE DE DIOS': [-12.59, -69.19],
  MOQUEGUA: [-17.19, -70.94],
  PASCO: [-10.68, -76.26],
  PIURA: [-5.19, -80.63],
  PUNO: [-15.84, -70.02],
  'SAN MARTIN': [-6.03, -76.97],
  TACNA: [-18.01, -70.25],
  TUMBES: [-3.57, -80.45],
  UCAYALI: [-8.38, -74.55],
};
