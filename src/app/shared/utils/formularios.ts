import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { t } from '../../core/i18n/idioma';

/** Mismas reglas que el backend (RegistroRequestDTO, PredioRequestDTO). */
export const PATRON_PASSWORD = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;
export const PATRON_TELEFONO = /^\d{9}$/;
export const LIMITES_PERU = { latMin: -18.4, latMax: 0.1, lngMin: -81.4, lngMax: -68.6 };

const MENSAJES: Record<string, (e: unknown) => string> = {
  required: () => t('Este dato es obligatorio.'),
  email: () => t('El correo no tiene un formato válido.'),
  minlength: (e) => t('Debe tener al menos {n} caracteres.', { n: (e as { requiredLength: number }).requiredLength }),
  maxlength: (e) => t('No debe superar {n} caracteres.', { n: (e as { requiredLength: number }).requiredLength }),
  min: (e) => t('El valor mínimo es {n}.', { n: (e as { min: number }).min }),
  max: (e) => t('El valor máximo es {n}.', { n: (e as { max: number }).max }),
  fueraDelPeru: () => t('La ubicación debe estar dentro del Perú.'),
  servidor: (e) => String(e),
};

/**
 * Mensaje de error de un campo, solo cuando el usuario ya lo tocó.
 * @param patron mensaje (en español) para el validador pattern; cada campo explica su propio formato
 */
export function errorDe(control: AbstractControl | null, patron = 'El formato no es válido.'): string | null {
  if (!control || !control.errors || !(control.touched || control.dirty)) {
    return null;
  }
  const [clave, valor] = Object.entries(control.errors)[0];
  if (clave === 'pattern') {
    return t(patron);
  }
  return MENSAJES[clave]?.(valor) ?? t('Revisa este dato.');
}

/** Pasa los errores por campo que devuelve el backend (ErrorApi.detalles, ya traducidos) a los controles. */
export function aplicarErroresServidor(formulario: FormGroup, detalles?: Record<string, string>): void {
  for (const [campo, mensaje] of Object.entries(detalles ?? {})) {
    const control = formulario.get(campo.split('.').pop() ?? campo) ?? formulario.get(campo);
    if (control) {
      control.setErrors({ servidor: mensaje });
      control.markAsTouched();
    }
  }
}

/** Valida que un número esté dentro de un rango (latitud o longitud del Perú). */
export function enRango(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (valor === null || valor === '' || valor === undefined) {
      return null;
    }
    return Number(valor) >= min && Number(valor) <= max ? null : { fueraDelPeru: true };
  };
}

/** Valida que el campo mínimo no supere al máximo (requerimientos del cultivo, US31). */
export function minimoNoMayorQueMaximo(minimo: string, maximo: string, mensaje: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const min = grupo.get(minimo)?.value;
    const max = grupo.get(maximo)?.value;
    if (min === null || max === null || min === '' || max === '' || min === undefined || max === undefined) {
      return null;
    }
    return Number(min) > Number(max) ? { [`rango_${minimo}`]: t(mensaje) } : null;
  };
}
