/**
 * Entorno de producción (ng build). Cuando la API tenga HTTPS con CloudFront (T67),
 * reemplazar apiUrl por la URL https de la distribución.
 */
export const environment = {
  production: true,
  apiUrl: 'http://agrocrew-backend.us-east-1.elasticbeanstalk.com/api/v1',
};
